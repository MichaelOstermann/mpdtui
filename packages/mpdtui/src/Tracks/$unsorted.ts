import { memo } from "@monstermann/signals"
import { Playlists } from "../Playlists"
import { $filtered } from "./$filtered"
import { sortUnsorted } from "./sort"

export const $unsorted = memo(() => {
    const files = new Set(Playlists.$all().flatMap(p => p.files))
    return sortUnsorted($filtered().filter(t => !files.has(t.file)))
})
