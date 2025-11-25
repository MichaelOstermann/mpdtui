import { defineConfig } from "tsdown"

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["./src/index.ts"],
    format: "esm",
    copy: {
        from: "../../node_modules/mpd-api/lib/api/spec",
        to: "dist/spec",
    },
    outputOptions: {
        banner: "#!/usr/bin/env bun",
    },
})
