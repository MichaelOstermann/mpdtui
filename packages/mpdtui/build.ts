import { chmod, rm } from "node:fs/promises"
import { transform } from "@monstermann/signals-transform"

const outdir = `${import.meta.dir}/dist`
await rm(outdir, { force: true, recursive: true })

const result = await Bun.build({
    banner: "#!/usr/bin/env bun",
    entrypoints: [`${import.meta.dir}/src/index.tsx`],
    jsx: { importSource: "@opentui/react" },
    minify: true,
    outdir,
    packages: "external",
    reactCompiler: true,
    reactCompilerOutputMode: "client",
    target: "bun",
    define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
    },
    plugins: [{
        name: "signals",
        setup(build) {
            build.onLoad({ filter: /\.[jt]sx?$/ }, async ({ loader, path }) => {
                if (!path.startsWith(`${import.meta.dir}/src/`)) return
                const code = await Bun.file(path).text()
                return {
                    contents: transform(code, path, { react: true })?.code ?? code,
                    loader,
                }
            })
        },
    }],
})

if (!result.success) throw new AggregateError(result.logs, "Failed to build mpdtui")
await chmod(`${outdir}/index.js`, 0o755)
for (const log of result.logs) console.warn(log)
process.stdout.write(`Built ${result.outputs[0]?.path}\n`)
