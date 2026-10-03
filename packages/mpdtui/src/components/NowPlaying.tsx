import type { ReactNode } from "react"
import { useTerminalDimensions } from "@opentui/react"
import { useEffect, useState } from "react"
import { Actions } from "../Actions"
import { Commandline } from "../Commandline"
import { State } from "../State"
import { theme } from "../theme"
import { Tracks } from "../Tracks"

const ICONS = { pause: "‖", play: "▶", stop: "■" }

export function NowPlaying(): ReactNode {
    const { width } = useTerminalDimensions()
    const status = State.$status()
    const track = State.$byFile().get(status.file)
    const [now, setNow] = useState(() => Date.now())

    // mpd only reports the position when asked, so it is extrapolated in between.
    useEffect(() => {
        if (status.state !== "play") return
        const timer = setInterval(() => setNow(Date.now()), 500)
        return () => clearInterval(timer)
    }, [status.state])

    const drift = status.state === "play" ? Math.max(0, now - status.at) / 1000 : 0
    const elapsed = Math.min(status.elapsed + drift, status.duration)
    const filled = status.duration ? Math.round(width * elapsed / status.duration) : 0

    const modes = [
        status.random && "shuffle",
        status.repeat && "repeat",
        status.single && "single",
    ].filter(mode => !!mode).join(" ")

    return (
        <box style={{ flexDirection: "column", flexShrink: 0 }}>
            <box
                style={{ flexDirection: "row", height: 1 }}
                onMouseDown={(event) => {
                    if (width) Commandline.run(() => Actions.seek(Math.floor(status.duration * event.x / width)))
                }}
            >
                {filled > 0 && <text fg={theme.blue} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{"━".repeat(filled)}</text>}
                <text fg={theme.brightBlack} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{"━".repeat(Math.max(0, width - filled))}</text>
            </box>
            <box style={{ flexDirection: "row", height: 1, overflow: "hidden", paddingLeft: 1, paddingRight: 1 }}>
                <text fg={theme.blue} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{`${ICONS[status.state]} `}</text>
                <text fg={theme.foreground} selectable={false} style={{ flexShrink: 1 }} wrapMode="none">{track?.title ?? ""}</text>
                <text fg={theme.white} selectable={false} style={{ flexGrow: 1, flexShrink: 1 }} wrapMode="none">{track?.artist ? `  ${track.artist}` : ""}</text>
                {!!modes && <text fg={theme.yellow} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{`  ${modes}`}</text>}
                <text fg={theme.white} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{`  ${status.volume}%`}</text>
                <text fg={theme.foreground} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{`  ${Tracks.formatDuration(elapsed)} / ${Tracks.formatDuration(status.duration)}`}</text>
            </box>
        </box>
    )
}
