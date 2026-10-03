import type { Playlist } from "./State"
import type { Track } from "./Tracks"
import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { peek } from "@monstermann/signals"
import { Commandline } from "./Commandline"
import { Mpd } from "./Mpd"
import { State } from "./State"

export namespace Actions {
    export async function play(tracks: Track[], index: number): Promise<void> {
        if (!tracks[index]) return
        await Mpd.run(
            "clear",
            ...tracks.map(track => Mpd.command("add", track.file)),
            Mpd.command("play", index),
        )
    }

    export async function toggle(): Promise<void> {
        const { state } = peek(State.$status)
        if (state === "stop") await Mpd.run("play")
        else await Mpd.run(Mpd.command("pause", state === "play" ? 1 : 0))
    }

    export async function skip(direction: "next" | "previous"): Promise<void> {
        if (peek(State.$status).state !== "stop") await Mpd.run(direction)
    }

    export async function seek(seconds: number): Promise<void> {
        if (peek(State.$status).state === "stop") return
        await Mpd.run(Mpd.command("seekcur", seconds))
        await State.refreshStatus()
    }

    export async function seekBy(seconds: number): Promise<void> {
        if (peek(State.$status).state === "stop") return
        await Mpd.run(Mpd.command("seekcur", seconds < 0 ? String(seconds) : `+${seconds}`))
        await State.refreshStatus()
    }

    export async function volumeBy(amount: number): Promise<void> {
        const { volume } = peek(State.$status)
        await Mpd.run(Mpd.command("setvol", Math.max(0, Math.min(100, volume + amount))))
    }

    export async function flip(option: "random" | "repeat" | "single"): Promise<void> {
        await Mpd.run(Mpd.command(option, peek(State.$status)[option] ? 0 : 1))
    }

    export async function addToPlaylist(name: string, tracks: Track[]): Promise<void> {
        const existing = new Set(peek(State.$playlists).find(playlist => playlist.name === name)?.files)
        const files = tracks.map(track => track.file).filter(file => !existing.has(file))
        await Mpd.run(...files.map(file => Mpd.command("playlistadd", name, file)))
        State.$anchor(undefined)
        Commandline.$output(`Added ${count(files.length)} to ${name}`)
    }

    export async function removeFromPlaylist(playlist: Playlist, tracks: Track[]): Promise<void> {
        const files = new Set(tracks.map(track => track.file))
        // Positions shift as entries are removed, so remove back to front.
        const positions = playlist.files.flatMap((file, position) => files.has(file) ? [position] : []).reverse()
        if (!await Commandline.confirm(`Remove ${count(positions.length)} from ${playlist.name}?`, false)) return
        await Mpd.run(...positions.map(position => Mpd.command("playlistdelete", playlist.name, position)))
        State.$anchor(undefined)
        Commandline.$output(`Removed ${count(positions.length)} from ${playlist.name}`)
    }

    export async function createPlaylist(name: string): Promise<void> {
        if (!name) return
        if (peek(State.$playlists).some(playlist => playlist.name === name)) throw new Error(`Playlist ${name} already exists`)
        const track = peek(State.$tracks)[0]
        if (!track) throw new Error("The library is empty")
        // mpd cannot create empty playlists, so a track is added and taken out again.
        await Mpd.run(Mpd.command("playlistadd", name, track.file), Mpd.command("playlistdelete", name, 0))
        await State.refreshPlaylists()
        State.select(State.keyOf(name))
    }

    export async function renamePlaylist(playlist: Playlist, name: string): Promise<void> {
        if (!name || name === playlist.name) return
        await Mpd.run(Mpd.command("rename", playlist.name, name))
        await State.refreshPlaylists()
        State.select(State.keyOf(name))
    }

    export async function deletePlaylist(playlist: Playlist): Promise<void> {
        if (!await Commandline.confirm(`Delete playlist ${playlist.name}?`, false)) return
        await Mpd.run(Mpd.command("rm", playlist.name))
    }

    export function openLocation(track: Track): void {
        const root = musicDirectory()
        if (!root) throw new Error("Could not find music_directory in mpd.conf")
        Bun.spawn(["xdg-open", dirname(join(root, track.file))], { stdio: ["ignore", "ignore", "ignore"] }).unref()
    }
}

function count(tracks: number): string {
    return tracks === 1 ? "1 track" : `${tracks} tracks`
}

function musicDirectory(): string | undefined {
    const home = homedir()
    const candidates = [
        join(process.env["XDG_CONFIG_HOME"] || join(home, ".config"), "mpd/mpd.conf"),
        join(home, ".mpdconf"),
        "/etc/mpd.conf",
    ]

    for (const candidate of candidates) {
        if (!existsSync(candidate)) continue
        const path = readFileSync(candidate, "utf8").match(/^\s*music_directory\s+"(.+?)"/m)?.[1]
        if (path) return path.replace(/^~(?=\/|$)/, home)
    }

    return undefined
}
