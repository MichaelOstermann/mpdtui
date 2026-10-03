import type { ReactNode } from "react"
import { batch } from "@monstermann/signals"
import { useEffect, useMemo, useState } from "react"
import { Actions } from "../Actions"
import { Commandline } from "../Commandline"
import { State } from "../State"
import { Table } from "../Table"
import { theme } from "../theme"
import { Tracks } from "../Tracks"
import { List } from "./List"

const GAP = "  "

const COLUMNS = [
    { name: "title" },
    { name: "artist" },
    { name: "album" },
    { name: "duration", reserved: true },
] as const

export function TrackList(): ReactNode {
    const [width, setWidth] = useState(0)
    const tracks = State.$viewing()
    const view = State.$view().key
    const filter = State.$filter()
    const playing = State.$status().file
    const focused = State.$focus() === "tracks"

    useEffect(() => {
        batch(() => {
            State.$tracksCursor(0)
            State.$tracksTop(0)
            State.$anchor(undefined)
        })
    }, [view, filter])

    const measurements = useMemo(() => ({
        album: tracks.map(track => Bun.stringWidth(track.album)),
        artist: tracks.map(track => Bun.stringWidth(track.artist)),
        duration: tracks.map(track => Tracks.formatDuration(track.duration).length),
        title: tracks.map(track => Bun.stringWidth(track.title)),
    }), [tracks])

    const widths = Table.layout({
        // Rows are padded by one cell on either side.
        available: Math.max(0, width - 2 - GAP.length * (COLUMNS.length - 1)),
        columns: COLUMNS,
        measurements,
    })

    return (
        <box
            onSizeChange={function () { setWidth(this.width) }}
            style={{ flexDirection: "column", flexGrow: 1 }}
        >
            <List
                $anchor={State.$anchor}
                $cursor={focused ? State.$tracksCursor : undefined}
                $scrollTop={State.$tracksTop}
                items={tracks}
                onOpen={index => Commandline.run(() => Actions.play(tracks, index))}
                onPress={index => batch(() => {
                    State.$tracksCursor(index)
                    State.$focus("tracks")
                })}
                render={track => (
                    <box style={{ flexDirection: "row", flexGrow: 1 }}>
                        <text fg={track.file === playing ? theme.green : theme.foreground} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{Table.cell(track.title, widths.title)}</text>
                        <text fg={theme.white} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{GAP + Table.cell(track.artist, widths.artist)}</text>
                        <text fg={theme.white} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{GAP + Table.cell(track.album, widths.album)}</text>
                        <text fg={theme.white} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{GAP + Table.cell(Tracks.formatDuration(track.duration), widths.duration, "right")}</text>
                    </box>
                )}
            />
        </box>
    )
}
