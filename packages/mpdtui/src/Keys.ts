import { signal } from "@monstermann/signals"

export interface Binding {
    key: string
    label: string
    run: () => unknown
}

export namespace Keys {
    export const $panel = signal<Binding[]>([])
}
