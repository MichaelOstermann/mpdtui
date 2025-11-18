import { memo } from "@monstermann/signals"
import { $filtered } from "./$filtered"
import { sortRecentlyAdded } from "./sort"

export const $recentlyAdded = memo(() => sortRecentlyAdded($filtered()))
