import type { Playlist } from "../Playlist"
import { signal } from "@monstermann/signals"
import { fetch } from "./fetch"

// eslint-disable-next-line antfu/no-top-level-await
export const $all = signal<Playlist[]>(await fetch())
