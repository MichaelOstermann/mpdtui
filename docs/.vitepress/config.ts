import { defineConfig } from "vitepress"
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons"

export default defineConfig({
    base: "/NAME/",
    description: "DESC",
    title: "NAME",
    markdown: {
        theme: {
            dark: "catppuccin-macchiato",
            light: "github-light-default",
        },
        config(md) {
            md.use(groupIconMdPlugin)
        },
    },
    themeConfig: {
        aside: false,
        outline: "deep",
        docFooter: {
            next: false,
            prev: false,
        },
        search: {
            provider: "local",
        },
        socialLinks: [
            { icon: "github", link: "https://github.com/MichaelOstermann/NAME" },
        ],
    },
    vite: {
        plugins: [
            groupIconVitePlugin(),
        ],
    },
})
