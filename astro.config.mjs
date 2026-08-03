import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";

export default defineConfig({
    site: "https://docs.bentobot.xyz",
    integrations: [
        sitemap(),
        starlight({
            title: "Bento Docs",
            description: "Commands and configuration for Bento, the Discord bot.",
            favicon: "/favicon.ico",
            logo: {
                src: "./src/assets/bento-logo.webp",
                alt: "Bento Bot",
            },
            head: [
                {
                    tag: "link",
                    attrs: {
                        rel: "apple-touch-icon",
                        sizes: "180x180",
                        href: "/apple-touch-icon.webp",
                    },
                },
                {
                    tag: "link",
                    attrs: {
                        rel: "icon",
                        type: "image/webp",
                        sizes: "32x32",
                        href: "/favicon-32x32.webp",
                    },
                },
                {
                    tag: "link",
                    attrs: {
                        rel: "icon",
                        type: "image/webp",
                        sizes: "16x16",
                        href: "/favicon-16x16.webp",
                    },
                },
                { tag: "link", attrs: { rel: "manifest", href: "/site.webmanifest" } },
            ],
            customCss: ["./src/styles/custom.css"],
            social: [
                {
                    icon: "github",
                    label: "GitHub",
                    href: "https://github.com/thebentobot/dotBento",
                },
                {
                    icon: "discord",
                    label: "Discord",
                    href: "https://discord.gg/dd68WwP",
                },
            ],
            sidebar: [
                {
                    label: "Bento homepage",
                    link: "https://bentobot.xyz",
                    attrs: {
                        target: "_blank",
                        rel: "noopener noreferrer",
                    },
                },
                { label: "Start here", items: ["getting-started"] },
                { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
                {
                    label: "Slash commands",
                    items: [{ autogenerate: { directory: "reference" } }],
                },
                { label: "Help", items: ["troubleshooting"] },
            ],
        }),
    ],
});
