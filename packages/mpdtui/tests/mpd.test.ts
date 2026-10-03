import { expect, test } from "bun:test"
import { Mpd } from "../src/Mpd"
import { Tracks } from "../src/Tracks"

test("Mpd.command quotes arguments", () => {
    expect(Mpd.command("playlistadd", "Drum & Bass", "a/b \"c\".m4a", 3))
        .toBe("playlistadd \"Drum & Bass\" \"a/b \\\"c\\\".m4a\" \"3\"")
})

test("Tracks.parse reads songs and skips directories", () => {
    const tracks = Tracks.parse([
        ["directory", "Artist"],
        ["Last-Modified", "2025-02-06T18:13:49Z"],
        ["file", "Artist/Album/01. Song.m4a"],
        ["Artist", "Artist"],
        ["Artist", "Someone Else"],
        ["Album", "Album"],
        ["Title", "Song"],
        ["Track", "1/12"],
        ["Disc", "2"],
        ["duration", "387.680"],
        ["file", "Loose/untitled.mp3"],
    ])

    expect(tracks).toEqual([
        { added: "", album: "Album", artist: "Artist", date: "", disc: 2, duration: 387.68, file: "Artist/Album/01. Song.m4a", title: "Song", track: 1 },
        { added: "", album: "", artist: "", date: "", disc: 0, duration: 0, file: "Loose/untitled.mp3", title: "untitled.mp3", track: 0 },
    ])
})

test("Tracks.formatDuration", () => {
    expect(Tracks.formatDuration(5)).toBe("0:05")
    expect(Tracks.formatDuration(387.68)).toBe("6:27")
    expect(Tracks.formatDuration(3975)).toBe("1:06:15")
})

test("Tracks.parseDuration", () => {
    expect(Tracks.parseDuration("90")).toBe(90)
    expect(Tracks.parseDuration("1:30")).toBe(90)
    expect(Tracks.parseDuration("1:02:03")).toBe(3723)
    expect(Tracks.parseDuration("1h30s")).toBeUndefined()
    expect(Tracks.parseDuration("")).toBeUndefined()
})
