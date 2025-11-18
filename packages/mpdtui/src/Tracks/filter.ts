import type { Track } from "../Track"
import fuzzysort from "fuzzysort"

export function filter(tracks: Track[], filter: string): Track[] {
    return tracks
        .map(track => ({ score: matchTrack(track, filter), track }))
        .filter(match => match.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(match => match.track)
}

function matchTrack(track: Track, filter: string): number {
    return Math.max(
        matchString(filter, track.title),
        matchString(filter, track.artist),
        matchString(filter, track.album),
    )
}

const matchCache = new Map<string, Fuzzysort.Prepared>()
function matchString(filter: string, value: string): number {
    if (!matchCache.has(value)) matchCache.set(value, fuzzysort.prepare(value))
    return fuzzysort.single(filter, matchCache.get(value)!)?.score ?? 0
}
