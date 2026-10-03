import type { Signal } from "@monstermann/signals"
import type { ReactNode } from "react"
import { batch, peek, signal } from "@monstermann/signals"
import { useTerminalDimensions } from "@opentui/react"
import { useEffect, useRef, useState } from "react"
import { useKeys } from "../hooks/useKeys"
import { theme } from "../theme"

export interface ListProps<T> {
    $anchor?: Signal<number | undefined>
    $cursor?: Signal<number>
    $scrollTop?: Signal<number>
    focused?: boolean
    items: readonly T[]
    onOpen?: (index: number) => void
    onPress?: (index: number) => void
    render: (item: T, selected: boolean) => ReactNode
}

export function List<T>({ $anchor, $cursor, $scrollTop, focused = true, items, onOpen, onPress, render }: ListProps<T>): ReactNode {
    const [$localScrollTop] = useState(() => signal(0))
    const terminal = useTerminalDimensions()
    const [height, setHeight] = useState(terminal.height)
    const lastPress = useRef({ at: 0, index: -1 })

    const $top = $scrollTop ?? $localScrollTop
    const raw = $cursor?.()
    const scrollTop = $top()

    const maxTop = Math.max(0, items.length - height)
    const cursor = raw === undefined ? undefined : Math.max(0, Math.min(raw, items.length - 1))
    const anchor = cursor === undefined ? undefined : $anchor?.()
    const from = Math.min(anchor ?? cursor ?? -1, cursor ?? -1)
    const to = Math.max(anchor ?? cursor ?? -1, cursor ?? -1)
    let top = Math.max(0, Math.min(scrollTop, maxTop))
    if (cursor !== undefined) {
        if (cursor < top) top = cursor
        else if (cursor >= top + height) top = cursor - height + 1
    }

    useEffect(() => {
        if (top !== scrollTop) $top(top)
        if (cursor !== undefined && cursor !== raw) $cursor!(cursor)
    })

    useKeys((key) => {
        if (!$cursor || !focused) return
        const at = peek($cursor)
        const last = Math.max(0, items.length - 1)
        const page = Math.max(1, Math.floor(height / 2))
        if (key.ctrl && key.name === "d") $cursor(Math.min(last, at + page))
        else if (key.ctrl && key.name === "u") $cursor(Math.max(0, at - page))
        else if (key.name === "j" || key.name === "down") $cursor(Math.min(last, at + 1))
        else if (key.name === "k" || key.name === "up") $cursor(Math.max(0, at - 1))
        else if (key.sequence === "g") $cursor(0)
        else if (key.sequence === "G") $cursor(last)
        else if (key.sequence === "v" && $anchor) $anchor(peek($anchor) === undefined ? at : undefined)
    })

    return (
        <box
            onSizeChange={function () { setHeight(this.height) }}
            style={{ flexDirection: "column", flexGrow: 1, overflow: "hidden" }}
            onMouseScroll={(event) => {
                const delta = (event.scroll?.delta ?? 1) * (event.scroll?.direction === "up" ? -1 : 1)
                const next = Math.max(0, Math.min(maxTop, top + delta))
                batch(() => {
                    $top(next)
                    if (cursor !== undefined) $cursor!(Math.max(next, Math.min(cursor, next + height - 1)))
                })
            }}
        >
            {items.slice(top, top + height).map((item, offset) => {
                const index = top + offset
                const selected = index >= from && index <= to
                return (
                    <box
                        key={index}
                        onMouseDown={() => {
                            const now = Date.now()
                            const isDouble = lastPress.current.index === index && now - lastPress.current.at < 400
                            lastPress.current = isDouble ? { at: 0, index: -1 } : { at: now, index }
                            onPress?.(index)
                            if (isDouble) onOpen?.(index)
                        }}
                        style={{
                            backgroundColor: selected ? theme.black : undefined,
                            flexDirection: "row",
                            flexShrink: 0,
                            paddingLeft: 1,
                            paddingRight: 1,
                        }}
                    >
                        {render(item, selected)}
                    </box>
                )
            })}
        </box>
    )
}
