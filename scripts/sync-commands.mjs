import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { manifestSchema } from "../src/lib/command-schema.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stableTag = /^v\d+\.\d+\.\d+$/;

export function groupCommands(commands) {
    return Map.groupBy(commands, (command) => command.groupPath[0]?.name ?? "general");
}

export function createReferencePage(group, commands) {
    const title =
        group === "general"
            ? "General"
            : commands[0].groupPath[0].name.replace(/^./, (c) => c.toUpperCase());
    const description =
        group === "general"
            ? "Commands that do not belong to a command group."
            : commands[0].groupPath[0].description;
    const sections = commands
        .map(
            (command) =>
                `## \`${command.invocation}\`\n\n<CommandReference commandId="${command.id}" />`
        )
        .join("\n\n");
    return `---\ntitle: ${title}\ndescription: ${JSON.stringify(description)}\n---\n\nimport CommandReference from '../../../components/CommandReference.astro';\n\n${sections}\n`;
}

export function validateRef(ref) {
    if (!stableTag.test(ref))
        throw new Error(`DOTBENTO_REF must be a stable vX.Y.Z tag; received ${ref}`);
    return ref;
}

export function validateNoteIds(notes, commandIds) {
    const seen = new Set();
    for (const note of notes) {
        if (!note.commandId || !commandIds.has(note.commandId))
            throw new Error(`Orphan or invalid command note: ${note.file}`);
        if (seen.has(note.commandId))
            throw new Error(`Duplicate command note for ${note.commandId}`);
        seen.add(note.commandId);
    }
}

async function latestStableRef() {
    const response = await fetch(
        "https://api.github.com/repos/thebentobot/dotBento/releases/latest",
        {
            headers: {
                Accept: "application/vnd.github+json",
                "User-Agent": "bento-docs",
            },
        }
    );
    if (!response.ok)
        throw new Error(`Could not resolve latest dotBento release (${response.status})`);
    return validateRef((await response.json()).tag_name);
}

async function loadSource() {
    const override = process.env.DOTBENTO_MANIFEST;
    if (override)
        return {
            text: await readFile(resolve(root, override), "utf8"),
            ref: process.env.DOTBENTO_REF ?? "local",
        };

    const adjacent = resolve(root, "../dotBento/docs/slash-commands.json");
    if (!process.env.CI && !process.env.DOTBENTO_REF && existsSync(adjacent))
        return {
            text: await readFile(adjacent, "utf8"),
            ref: "local working tree",
        };

    const ref = validateRef(process.env.DOTBENTO_REF ?? (await latestStableRef()));
    const url = `https://raw.githubusercontent.com/thebentobot/dotBento/${ref}/docs/slash-commands.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not fetch manifest for ${ref} (${response.status})`);
    return { text: await response.text(), ref };
}

export async function sync() {
    const source = await loadSource();
    const manifest = manifestSchema.parse(JSON.parse(source.text));
    const ids = new Set(manifest.commands.map((command) => command.id));
    if (ids.size !== manifest.commands.length)
        throw new Error("Command manifest contains duplicate IDs");

    const notesDir = resolve(root, "src/content/command-notes");
    if (existsSync(notesDir)) {
        const { readdir } = await import("node:fs/promises");
        const notes = [];
        for (const file of await readdir(notesDir)) {
            const note = await readFile(resolve(notesDir, file), "utf8");
            const commandId = note.match(/^commandId:\s*["']?([^"'\n]+)["']?$/m)?.[1];
            notes.push({ commandId, file });
        }
        validateNoteIds(notes, ids);
    }

    const generated = resolve(root, "src/generated");
    const reference = resolve(root, "src/content/docs/reference");
    await mkdir(generated, { recursive: true });
    await mkdir(reference, { recursive: true });
    await writeFile(resolve(generated, "commands.json"), JSON.stringify(manifest, null, 2) + "\n");
    await writeFile(
        resolve(generated, "release.json"),
        JSON.stringify({ ref: source.ref }, null, 2) + "\n"
    );

    const groups = groupCommands(manifest.commands);
    const links = [];
    for (const [group, commands] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
        await writeFile(resolve(reference, `${group}.mdx`), createReferencePage(group, commands));
        links.push(
            `- [${group === "general" ? "General" : group.replace(/^./, (c) => c.toUpperCase())}](./${group}/)`
        );
    }
    await writeFile(
        resolve(reference, "index.mdx"),
        `---\ntitle: Slash commands\ndescription: Every slash command in the current stable Bento release.\n---\n\nDocumentation source: **${source.ref}**\n\n${links.join("\n")}\n`
    );
    console.log(`Synced ${manifest.commands.length} slash commands from ${source.ref}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await sync();
