import type { ReactNode } from "react"
import { peek } from "@monstermann/signals"
import { useRenderer } from "@opentui/react"
import fuzzysort from "fuzzysort"
import { Actions } from "./Actions"
import { Commandline } from "./Commandline"
import { NowPlaying } from "./components/NowPlaying"
import { Sidebar } from "./components/Sidebar"
import { Statusbar } from "./components/Statusbar"
import { TrackList } from "./components/TrackList"
import { useBindings } from "./hooks/useBindings"
import { useKeys } from "./hooks/useKeys"
import { Mpd } from "./Mpd"
import { State } from "./State"
import { Tracks } from "./Tracks"

export function App(): ReactNode {
    const renderer = useRenderer()
    const focus = State.$focus()
    const playlist = State.$view().playlist
    const selection = State.$selection()
    const track = selection[0]

    useKeys((key) => {
        const tracks = focus === "tracks"

        if (key.sequence === "q") renderer.destroy()
        else if (key.name === "`") renderer.console.toggle()
        else if (key.name === "tab") State.$focus(tracks ? "sidebar" : "tracks")
        else if (key.name === "escape" && peek(State.$anchor) !== undefined) State.$anchor(undefined)
        else if (key.name === "escape" && peek(State.$filter)) State.$filter("")
        else if (tracks && (key.name === "escape" || key.name === "h" || key.name === "left")) State.$focus("sidebar")
        else if (!tracks && (key.name === "return" || key.name === "l" || key.name === "right")) State.$focus("tracks")
        else if (tracks && key.name === "return") Commandline.run(() => Actions.play(peek(State.$viewing), peek(State.$tracksCursor)))
        else if (key.sequence === "/") filter()
        else if (key.sequence === "t") seekTo()
        else if (key.sequence === "p" || key.name === "space") Commandline.run(Actions.toggle)
        else if (key.sequence === "<") Commandline.run(() => Actions.skip("previous"))
        else if (key.sequence === ">") Commandline.run(() => Actions.skip("next"))
        else if (key.sequence === "b") Commandline.run(() => Actions.seekBy(-5))
        else if (key.sequence === "f") Commandline.run(() => Actions.seekBy(5))
        else if (key.sequence === ",") Commandline.run(() => Actions.volumeBy(-5))
        else if (key.sequence === ".") Commandline.run(() => Actions.volumeBy(5))
        else if (key.sequence === "x") Commandline.run(() => Actions.flip("random"))
        else if (key.sequence === "z") Commandline.run(() => Actions.flip("repeat"))
        else if (key.sequence === "s") Commandline.run(() => Actions.flip("single"))
        else if (key.sequence === "S") Commandline.run(() => Mpd.run("stop"))
        else if (key.sequence === "u") Commandline.run(() => Mpd.run("update"))
    })

    useBindings(focus === "sidebar"
        ? {
                d: playlist && ["delete", () => Actions.deletePlaylist(playlist)],
                n: ["new playlist", () => Commandline.ask({
                    prefix: "New playlist: ",
                    onSubmit: name => Actions.createPlaylist(name.trim()),
                })],
                r: playlist && ["rename", () => Commandline.ask({
                    prefix: "Rename: ",
                    value: playlist.name,
                    onSubmit: name => Actions.renamePlaylist(playlist, name.trim()),
                })],
            }
        : {
                d: track && playlist && ["remove", () => Actions.removeFromPlaylist(playlist, selection)],
                o: track && ["open folder", () => Actions.openLocation(track)],
                v: track && ["select", () => {}],
                a: track && ["add to playlist", () => Commandline.ask({
                    prefix: "Add to: ",
                    hint: value => match(value) ?? "",
                    onSubmit(value) {
                        const name = match(value)
                        if (!name) throw new Error(`No playlist matching ${value}`)
                        return Actions.addToPlaylist(name, selection)
                    },
                })],
            })

    return (
        <box style={{ flexDirection: "column", height: "100%", width: "100%" }}>
            <box style={{ flexDirection: "row", flexGrow: 1, gap: 1 }}>
                <box style={{ flexDirection: "column", flexShrink: 0, width: 36 }}>
                    <Sidebar />
                </box>
                <box style={{ flexDirection: "column", flexGrow: 1 }}>
                    <TrackList />
                </box>
            </box>
            <NowPlaying />
            <Commandline.Root />
            <Statusbar />
        </box>
    )
}

function seekTo(): void {
    Commandline.ask({
        prefix: "Seek to: ",
        onSubmit(value) {
            const seconds = Tracks.parseDuration(value)
            if (seconds === undefined) throw new Error(`Invalid time ${value}`)
            return Actions.seek(seconds)
        },
    })
}

function filter(): void {
    Commandline.ask({
        onInput: State.$filter,
        prefix: "/",
        value: peek(State.$filter),
        onCancel: () => State.$filter(""),
        onSubmit: () => State.$focus("tracks"),
    })
}

function match(value: string): string | undefined {
    const names = peek(State.$playlists).map(playlist => playlist.name)
    return fuzzysort.go(value.trim(), names, { limit: 1 })[0]?.target
}
