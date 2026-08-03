import { describe, expect, it } from "vitest";
import {
    createReferencePage,
    groupCommands,
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
