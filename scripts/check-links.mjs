import { access, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve("dist");
const htmlFiles = [];
async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) await walk(path);
        else if (path.endsWith(".html")) htmlFiles.push(path);
    }
}
await walk(dist);

const missing = new Set();
for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
        if (!href.startsWith("/") || href.startsWith("//")) continue;
        const pathname = href.split(/[?#]/)[0];
        if (!pathname) continue;
        const target = pathname.endsWith("/")
            ? resolve(dist, `.${pathname}`, "index.html")
            : resolve(dist, `.${pathname}`);
        try {
            await access(target);
        } catch {
            missing.add(`${file.replace(dist, "")} -> ${pathname}`);
        }
    }
}
if (missing.size) throw new Error(`Broken internal links:\n${[...missing].join("\n")}`);
console.log(`Checked internal links across ${htmlFiles.length} HTML files.`);
