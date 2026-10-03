import type { Track } from "./Tracks"
import { batch, memo, peek, signal } from "@monstermann/signals"
import { Mpd } from "./Mpd"
import { Tracks } from "./Tracks"

export interface Playlist {
    files: string[]
    name: string
}

export interface Status {
    at: number
    duration: number
    elapsed: number
    file: string
    random: boolean
    repeat: boolean
    single: boolean
    state: "stop" | "play" | "pause"
    volume: number
}

export interface View {
    count: number | undefined
    key: string
    playlist?: Playlist
    title: string
}

export namespace State {
    export const $tracks = signal<Track[]>([])
    export const $playlists = signal<Playlist[]>([])
    export const $status = signal<Status>({
        at: 0,
        duration: 0,
        elapsed: 0,
        file: "",
        random: false,
        repeat: false,
        single: false,
        state: "stop",
        volume: 0,
    })

    export const $focus = signal<"sidebar" | "tracks">("sidebar")
    export const $filter = signal("")
    export const $sidebarCursor = signal(0)
    export const $sidebarTop = signal(0)
    export const $tracksCursor = signal(0)
    export const $tracksTop = signal(0)
    export const $anchor = signal<number | undefined>(undefined)

    export const $byFile = memo(() => new Map($tracks().map(track => [track.file, track])))

    export const $unsorted = memo(() => {
        const sorted = new Set($playlists().flatMap(playlist => playlist.files))
        return $tracks().filter(track => !sorted.has(track.file))
    })

    export const $views = memo<View[]>(() => [
        { count: $tracks().length, key: "library", title: "Library" },
        { count: undefined, key: "recent", title: "Recently Added" },
        { count: $unsorted().length, key: "unsorted", title: "Unsorted" },
        ...$playlists().map(playlist => ({
            count: playlist.files.length,
            key: keyOf(playlist.name),
            playlist,
            title: playlist.name,
        })),
    ])

    export const $view = memo(() => $views()[$sidebarCursor()] ?? $views()[0]!)

    export const $viewing = memo<Track[]>(() => {
        const view = $view()
        const filter = $filter()
        const byFile = $byFile()

        const tracks = view.playlist
            ? view.playlist.files.flatMap(file => byFile.get(file) ?? [])
            : view.key === "unsorted"
                ? $unsorted()
                : $tracks()

        if (filter) return Tracks.filter(tracks, filter)
        if (view.playlist) return Tracks.sortPlaylist(tracks)
        if (view.key === "recent") return Tracks.sortRecentlyAdded(tracks)
        return Tracks.sortLibrary(tracks)
    })

    // The tracks actions apply to: the range between anchor and cursor, or just the cursor.
    export const $selection = memo<Track[]>(() => {
        const cursor = $tracksCursor()
        const anchor = $anchor() ?? cursor
        return $viewing().slice(Math.min(anchor, cursor), Math.max(anchor, cursor) + 1)
    })

    export function keyOf(playlist: string): string {
        return `playlist:${playlist}`
    }

    export function select(key: string): void {
        const index = peek($views).findIndex(view => view.key === key)
        if (index >= 0) $sidebarCursor(index)
    }

    export async function refreshTracks(): Promise<void> {
        const [pairs = []] = await Mpd.run("listallinfo")
        $tracks(Tracks.parse(pairs))
    }

    export async function refreshPlaylists(): Promise<void> {
        const [pairs = []] = await Mpd.run("listplaylists")
        const names = pairs.flatMap(([key, value]) => key === "playlist" ? [value] : [])
        const lists = await Mpd.run(...names.map(name => Mpd.command("listplaylist", name)))
        const playlists = names
            .map((name, index) => ({ files: (lists[index] ?? []).map(([, file]) => file), name }))
            .sort((a, b) => a.name.localeCompare(b.name))

        // Playlists may shift around, keep the cursor on the one being viewed.
        batch(() => {
            const key = peek($view).key
            $playlists(playlists)
            select(key)
        })
    }

    export async function refreshStatus(): Promise<void> {
        const [status = [], song = []] = await Mpd.run("status", "currentsong")
        const values = new Map([...status, ...song])
        $status({
            at: Date.now(),
            duration: Number(values.get("duration")) || 0,
            elapsed: Number(values.get("elapsed")) || 0,
            file: values.get("file") ?? "",
            random: values.get("random") === "1",
            repeat: values.get("repeat") === "1",
            single: values.get("single") === "1",
            state: (values.get("state") ?? "stop") as Status["state"],
            volume: Number(values.get("volume")) || 0,
        })
    }

    export async function sync(): Promise<void> {
        await Promise.all([refreshTracks(), refreshPlaylists(), refreshStatus()])
        await Mpd.idle(["database", "stored_playlist", "player", "mixer", "options"], (changed) => {
            if (changed.includes("database")) refreshTracks()
            if (changed.includes("stored_playlist")) refreshPlaylists()
            if (changed.some(name => name === "player" || name === "mixer" || name === "options")) refreshStatus()
        })
    }
}
