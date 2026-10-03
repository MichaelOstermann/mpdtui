import type { ReactNode } from "react"
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { Component } from "react"
import { App } from "./App"
import { State } from "./State"
import { theme } from "./theme"

const renderer = await createCliRenderer({
    exitOnCtrlC: true,
})

renderer.setCursorColor(theme.foreground)

function bail(error: unknown): void {
    renderer.destroy()
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
}

class Bail extends Component<{ children: ReactNode }, { failed: boolean }> {
    override state = { failed: false }

    static getDerivedStateFromError(): { failed: boolean } {
        return { failed: true }
    }

    override componentDidCatch(error: unknown): void {
        bail(error)
    }

    override render(): ReactNode {
        return this.state.failed ? null : this.props.children
    }
}

process.on("uncaughtException", bail)
process.on("unhandledRejection", bail)

State.sync().catch(bail)

createRoot(renderer).render(
    <Bail>
        <App />
    </Bail>,
)
