import { memo } from "@monstermann/signals"
import { Sidebar } from "../Sidebar"
import { $filtered } from "./$filtered"
import { $library } from "./$library"
import { $recentlyAdded } from "./$recentlyAdded"
import { $unsorted } from "./$unsorted"
import { sortPlaylist } from "./sort"

export const $viewing = memo(() => {
    const line = Sidebar.list.selectedLine()
    if (line?.type === "library") return $library()
    if (line?.type === "recently_added") return $recentlyAdded()
    if (line?.type === "playlist") return sortPlaylist(line.value.files.map(file => $filtered().find(t => t.file === file)).filter(t => !!t))
    if (line?.type === "unsorted") return $unsorted()
    return []
})
