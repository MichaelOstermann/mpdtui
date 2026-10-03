import { useEffect } from "react"
import { Keys } from "../Keys"

type Falsy = "" | 0 | false | null | undefined
type Entry = [label: string, run: () => unknown]

export function useBindings(bindings: Record<string, Entry | Falsy>): void {
    const entries = Object.entries(bindings).flatMap(([key, entry]) =>
        entry ? [{ key, label: entry[0], run: entry[1] }] : [])

    useEffect(() => {
        Keys.$panel(entries)
    })

    useEffect(() => {
        return () => void Keys.$panel([])
    }, [])
}
