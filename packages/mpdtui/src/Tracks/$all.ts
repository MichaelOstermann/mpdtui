import type { Track } from "../Track"
import { signal } from "@monstermann/signals"
import { fetch } from "./fetch"

// eslint-disable-next-line antfu/no-top-level-await
export const $all = signal<Track[]>(await fetch())
