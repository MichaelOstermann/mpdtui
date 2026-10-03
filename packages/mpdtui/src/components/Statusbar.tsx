import type { ReactNode } from "react"
import { Commandline } from "../Commandline"
import { Keys } from "../Keys"
import { theme } from "../theme"
import { Spinner } from "./Spinner"

const GLOBAL = [
    ["p", "play/pause"],
    ["x", "shuffle"],
    ["z", "repeat"],
    ["s", "single"],
    ["t", "seek"],
    ["/", "filter"],
] as const

export function Statusbar(): ReactNode {
    const panel = Keys.$panel()
    const busy = Commandline.$busy()

    return (
        <box style={{ flexDirection: "row", flexShrink: 0, height: 1, overflow: "hidden" }}>
            <Spinner enabled={busy} />
            <box style={{ flexDirection: "row", flexGrow: 1, flexShrink: 1, overflow: "hidden", paddingLeft: 1 }}>
                {GLOBAL.map(([key, label]) => (
                    <box key={key} style={{ flexDirection: "row", flexShrink: 0 }}>
                        <text fg={theme.yellow} selectable={false} wrapMode="none">{key}</text>
                        <text fg={theme.white} selectable={false} wrapMode="none">{` ${label}  `}</text>
                    </box>
                ))}
            </box>
            {panel.map(binding => (
                <box key={binding.key} style={{ flexDirection: "row", flexShrink: 0 }}>
                    <text fg={theme.yellow} selectable={false} wrapMode="none">{binding.key}</text>
                    <text fg={theme.white} selectable={false} wrapMode="none">{` ${binding.label}  `}</text>
                </box>
            ))}
        </box>
    )
}
