import { batch, watch } from "@monstermann/signals"
import { Ansi, Input, List, Term } from "@monstermann/signals-tui"
import { client } from "./client"
import { Cmdline } from "./Cmdline"
import { Playlists } from "./Playlists"
import { Sidebar } from "./Sidebar"
import { Status } from "./Status"
import { Statusbar } from "./Statusbar"
import { Tracks } from "./Tracks"

async function play(file: string, files: string[]): Promise<void> {
    await client.api.queue.clear()
    for (const file of files)
        await client.api.queue.add(file)
    await client.api.playback.play(files.indexOf(file) as any)
}

async function refresh(): Promise<void> {
    const tracks = await Tracks.fetch()
    const playlists = await Playlists.fetch()
    batch(() => {
        Tracks.$all(tracks)
        Playlists.$all(playlists)
    })
}

watch(Sidebar.list.selectedLine, () => List.selectFirst(Tracks.list))

let lastClick: { at: number, col: number, row: number } | undefined
Term.onMouse((event) => {
    if (
        event.type === "up"
        && lastClick?.row === event.row
        && lastClick?.col === event.col
        && (Date.now() - lastClick.at) <= 300
    ) {
        lastClick = undefined
        if (Tracks.list.isFocused()) {
            const line = Tracks.list.selectedLine()
            if (line) play(line.data.file, Tracks.$viewing().map(t => t.file))
        }
    }
    else if (event.type === "up") {
        lastClick = { at: Date.now(), col: event.col, row: event.row }
    }
})

Term.onShortcuts({
    ",": () => {
        const currentVol = Status.$current().volume
        client.api.playback.setvol(Math.max(currentVol - 5, 0) as any)
    },
    ".": () => {
        const currentVol = Status.$current().volume
        client.api.playback.setvol(Math.min(currentVol + 5, 100) as any)
    },
    "/": () => {
        Input.set(Cmdline.input, "/")
        Input.focus(Cmdline.input)
    },
    "<": () => {
        if (Status.$current().state === "stop") return
        client.api.playback.prev()
    },
    "<cr>": () => {
        if (Tracks.list.isFocused()) {
            const line = Tracks.list.selectedLine()
            if (line) play(line.data.file, Tracks.$viewing().map(t => t.file))
        }
    },
    "<esc>": () => {
        Input.reset(Cmdline.input)
    },
    "<left>": () => {
        List.focus(Sidebar.list)
    },
    "<right>": () => {
        List.focus(Tracks.list)
    },
    "<s-u>": async () => {
        await client.api.db.rescan()
        refresh()
    },
    "<tab>": () => {
        if (Sidebar.list.isFocused()) List.focus(Tracks.list)
        else List.focus(Sidebar.list)
    },
    ">": () => {
        if (Status.$current().state === "stop") return
        client.api.playback.next()
    },
    "b": () => {
        client.api.playback.seekcur(`-5`)
    },
    "f": () => {
        client.api.playback.seekcur(`+5`)
    },
    "p": () => {
        if (Status.$current().state === "play") client.api.playback.pause()
        else client.api.playback.play()
    },
    "q": () => {
        Term.exit()
    },
    "s": () => {
        client.api.playback.stop()
    },
    "u": async () => {
        await client.api.db.update()
        refresh()
    },
    "v": () => {
        const current = Status.$current().single
        client.api.playback.single(!current as any)
    },
    "x": () => {
        const current = Status.$current().random
        client.api.playback.random(!current as any)
    },
    "z": () => {
        const current = Status.$current().repeat
        client.api.playback.repeat(!current as any)
    },
})

Status.sync()
Term.onCtrlC(Term.exit)
Term.onExit(Term.enterAlternateScreen())
Term.onExit(Term.startCapturingInput())
Term.write(Ansi.cursorBlock)
Term.render(() => {
    Sidebar.render()
    Tracks.render()
    Statusbar.render()
    Cmdline.render()
})
