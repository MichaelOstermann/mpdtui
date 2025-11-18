import { memo } from "@monstermann/signals"
import { Table, text } from "@monstermann/signals-tui"
import { Sidebar } from "../Sidebar"
import { Track } from "../Track"
import { $viewing } from "./$viewing"

export const table = Table.create({
    col: memo(() => Sidebar.list.right() + 2),
    data: $viewing,
    gap: [text("  ")],
    columns: [
        { name: "title" },
        { name: "artist" },
        { name: "album" },
        { align: "right", name: "duration", reserved: true },
    ],
    getBodyCell({ col, data }) {
        if (col === "duration") return Track.formatDuration(data[col])
        return String(data[col] || "")
    },
})
