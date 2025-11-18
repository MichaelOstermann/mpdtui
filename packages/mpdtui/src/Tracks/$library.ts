import { memo } from "@monstermann/signals"
import { $filtered } from "./$filtered"
import { sortLibrary } from "./sort"

export const $library = memo(() => sortLibrary($filtered()))
