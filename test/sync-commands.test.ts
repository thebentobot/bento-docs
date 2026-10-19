import { afterEach, describe, expect, it, vi } from "vitest";
import {
    createReferenceLink,
    createReferencePage,
    groupCommands,
    latestStableRef,
    validateNoteIds,
    validateRef,
} from "../scripts/sync-commands.mjs";
import { manifestSchema } from "../src/lib/command-schema";

const command = (
    id: string,
    path: string[],
    groupPath: { name: string; description: string }[] = []
) => ({
    id,
    path,
    invocation: `/${path.join(" ")}`,
    description: `${id} description`,
    groupPath,
    guildOnly: false,
    requiredUserPermissions: [],
    options: [],
});

describe("command reference generation", () => {
    it("puts ungrouped commands on the General page and preserves nested groups", () => {
        const grouped = groupCommands([
            command("ping", ["ping"]),
            command(
                "profile:background:upload",
                ["profile", "background", "upload"],
                [
                    { name: "profile", description: "Profiles" },
                    { name: "background", description: "Backgrounds" },
                ]
            ),
        ]);
        expect(grouped.get("general")?.[0].id).toBe("ping");
        expect(grouped.get("profile")?.[0].path).toEqual(["profile", "background", "upload"]);
    });

    it("writes literal headings for Starlight search and table-of-contents indexing", () => {
        const page = createReferencePage("profile", [
            command(
                "profile:user",
                ["profile", "user"],
                [{ name: "profile", description: "Profiles" }]
            ),
        ]);
        expect(page).toContain("## `/profile user`");
        expect(page).toContain('<CommandReference commandId="profile:user" />');
    });

    it("links command groups beneath the reference route", () => {
        expect(createReferenceLink("about")).toBe("- [About](/reference/about/)");
        expect(createReferenceLink("general")).toBe("- [General](/reference/general/)");
    });
});

describe("release lookup", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("authenticates release lookup to avoid the anonymous rate limit", async () => {
        vi.stubEnv("GITHUB_TOKEN", "test-token");
        const fetch = vi.fn(async (_url: string, options: { headers: Record<string, string> }) =>
            options.headers.Authorization === "Bearer test-token"
                ? Response.json({ tag_name: "v2.14.3" })
                : new Response("API rate limit exceeded", { status: 403 })
        );
        vi.stubGlobal("fetch", fetch);

        await expect(latestStableRef()).resolves.toBe("v2.14.3");
        expect(fetch).toHaveBeenCalledWith(
            "https://api.github.com/repos/thebentobot/dotBento/releases/latest",
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
            })
        );
    });

    it("supports local release lookup without a token", async () => {
        vi.stubEnv("GITHUB_TOKEN", "");
        const fetch = vi.fn().mockResolvedValue(Response.json({ tag_name: "v2.14.3" }));
        vi.stubGlobal("fetch", fetch);

        await expect(latestStableRef()).resolves.toBe("v2.14.3");
        expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
    });

    it("fails when GitHub rejects the release lookup", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
        await expect(latestStableRef()).rejects.toThrow(
            "Could not resolve latest dotBento release (403)"
        );
    });
});

describe("release refs", () => {
    it.each(["main", "v1.0.0-beta.1", "1.0.0", "../master"])("rejects non-stable ref %s", (ref) => {
        expect(() => validateRef(ref)).toThrow();
    });
    it("accepts a stable semantic release tag", () =>
        expect(validateRef("v2.14.3")).toBe("v2.14.3"));
});

describe("input validation", () => {
    it("rejects an incompatible manifest schema", () => {
        expect(() => manifestSchema.parse({ schemaVersion: 2, commands: [] })).toThrow();
    });

    it("rejects orphan and duplicate MDX overlays", () => {
        const commandIds = new Set(["ping"]);
        expect(() =>
            validateNoteIds([{ commandId: "missing", file: "missing.mdx" }], commandIds)
        ).toThrow(/Orphan/);
        expect(() =>
            validateNoteIds(
                [
                    { commandId: "ping", file: "one.mdx" },
                    { commandId: "ping", file: "two.mdx" },
                ],
                commandIds
            )
        ).toThrow(/Duplicate/);
    });
});
