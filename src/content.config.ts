import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "zod";

export const collections = {
    docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
    commandNotes: defineCollection({
        loader: glob({
            pattern: "**/*.{md,mdx}",
            base: "./src/content/command-notes",
        }),
        schema: z.object({ commandId: z.string() }),
    }),
};
