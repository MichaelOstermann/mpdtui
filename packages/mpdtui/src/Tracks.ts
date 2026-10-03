import type { Mpd } from "./Mpd"
import fuzzysort from "fuzzysort"

export interface Track {
    added: string
    album: string
    artist: string
    date: string
    disc: number
    duration: number
    file: string
    title: string
    track: number
}

export namespace Tracks {
    export function parse(pairs: Mpd.Pairs): Track[] {
        const tracks: Track[] = []
        let track: Track | undefined

        for (const [key, value] of pairs) {
            if (key === "file") {
                track = { added: "", album: "", artist: "", date: "", disc: 0, duration: 0, file: value, title: "", track: 0 }
                tracks.push(track)
            }
            // Directories and playlists are listed alongside songs.
            else if (key === "directory" || key === "playlist") {
                track = undefined
            }
            else if (!track) {
                continue
            }
            else if (key === "Title") {
                track.title ||= value
            }
            else if (key === "Artist") {
                track.artist ||= value
            }
            else if (key === "Album") {
                track.album ||= value
            }
            else if (key === "Date") {
                track.date ||= value
            }
            else if (key === "Added") {
                track.added = value
            }
            else if (key === "Track") {
                track.track = Number.parseInt(value) || 0
            }
            else if (key === "Disc") {
                track.disc = Number.parseInt(value) || 0
            }
            else if (key === "duration") {
                track.duration = Number(value) || 0
            }
        }

        for (const track of tracks)
            track.title ||= track.file.split("/").at(-1) ?? ""

        return tracks
    }

    export function formatDuration(seconds: number): string {
        const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
        const h = Math.floor(total / 3600)
        const m = Math.floor((total % 3600) / 60)
        const s = String(total % 60).padStart(2, "0")
        return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`
    }

    // Accepts "1:30" and "1:02:03", or plain seconds.
    export function parseDuration(value: string): number | undefined {
        const input = value.trim()
        if (!/^\d+(?::\d+){0,2}$/.test(input)) return undefined
        return input.split(":").reduce((total, part) => total * 60 + Number(part), 0)
    }

    export function filter(tracks: Track[], filter: string): Track[] {
        return tracks
            .map(track => ({ score: matchTrack(track, filter), track }))
            .filter(match => match.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(match => match.track)
    }

    export function sortLibrary(tracks: Track[]): Track[] {
        return tracks.toSorted((a, b) => {
            return compareArtists(a, b)
                || compareAlbums(a, b)
                || compareAlbumTracks(a, b)
        })
    }

    export function sortRecentlyAdded(tracks: Track[]): Track[] {
        return tracks.toSorted((a, b) => {
            return compareAdded(b, a)
                || compareAlbums(a, b)
                || compareAlbumTracks(a, b)
        })
    }

    export function sortPlaylist(tracks: Track[]): Track[] {
        const groups = new Map<string, { date: string, name: string, tracks: Track[] }>()

        for (const track of tracks) {
            const group = groups.get(track.album)
            if (!group) {
                groups.set(track.album, { date: track.date, name: track.album, tracks: [track] })
            }
            else {
                group.date ||= track.date
                group.tracks.push(track)
            }
        }

        const albums = Array.from(groups.values())
        const leftoverAlbums = albums.filter(album => !album.name || album.tracks.length === 1)

        const leftoverTracks = leftoverAlbums
            .flatMap(album => album.tracks)
            .sort((a, b) => compareArtists(a, b) || compareTitles(a, b))

        const albumTracks = albums
            .filter(album => !leftoverAlbums.includes(album))
            .sort((a, b) => {
                if (a.date < b.date) return -1
                if (a.date > b.date) return 1
                return a.name.localeCompare(b.name)
            })
            .flatMap(album => album.tracks.sort(compareAlbumTracks))

        for (const track of leftoverTracks) {
            const idx = albumTracks.findLastIndex(t => t.artist === track.artist)
            if (idx < 0) albumTracks.push(track)
            else albumTracks.splice(idx + 1, 0, track)
        }

        return albumTracks
    }
}

const prepared = new Map<string, Fuzzysort.Prepared>()

function matchTrack(track: Track, filter: string): number {
    return Math.max(
        matchString(filter, track.title),
        matchString(filter, track.artist),
        matchString(filter, track.album),
    )
}

function matchString(filter: string, value: string): number {
    if (!prepared.has(value)) prepared.set(value, fuzzysort.prepare(value))
    return fuzzysort.single(filter, prepared.get(value)!)?.score ?? 0
}

function compareAlbumTracks(a: Track, b: Track): number {
    return a.disc - b.disc
        || a.track - b.track
        || compareArtists(a, b)
        || compareTitles(a, b)
}

function compareTitles(a: Track, b: Track): number {
    return a.title.localeCompare(b.title)
}

function compareArtists(a: Track, b: Track): number {
    if (a.artist === "" && b.artist !== "") return 1
    if (a.artist !== "" && b.artist === "") return -1
    return a.artist.localeCompare(b.artist)
}

function compareAlbums(a: Track, b: Track): number {
    return a.album.localeCompare(b.album)
}

function compareAdded(a: Track, b: Track): number {
    if (a.added === b.added) return 0
    return a.added < b.added ? -1 : 1
}
