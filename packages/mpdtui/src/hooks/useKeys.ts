import type { KeyEvent } from "@opentui/core"
import { peek } from "@monstermann/signals"
import { useKeyboard } from "@opentui/react"
import { Commandline } from "../Commandline"

export function useKeys(handler: (key: KeyEvent) => void): void {
    useKeyboard((key) => {
        if (key.propagationStopped || peek(Commandline.$focused)) return
        handler(key)
    })
}
