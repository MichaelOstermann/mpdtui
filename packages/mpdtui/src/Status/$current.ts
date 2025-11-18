import type { Status } from "./types"
import { signal } from "@monstermann/signals"
import { fetch } from "./fetch"

// eslint-disable-next-line antfu/no-top-level-await
export const $current = signal<Status>(await fetch())
