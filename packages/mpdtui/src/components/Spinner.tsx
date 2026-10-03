import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { theme } from "../theme"

const FRAMES = ["-", "\\", "|", "/"]

export function Spinner({ enabled }: { enabled: boolean }): ReactNode {
    const [frame, setFrame] = useState(0)

    useEffect(() => {
        if (!enabled) return
        const timer = setInterval(() => setFrame(current => current + 1), 80)
        return () => clearInterval(timer)
    }, [enabled])

    if (!enabled) return <text selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{" "}</text>

    return <text fg={theme.magenta} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{FRAMES[frame % FRAMES.length]}</text>
}
