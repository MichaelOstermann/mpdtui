import type { Text } from "@monstermann/signals-tui"
import type { SidebarItem } from "./types"
import { memo } from "@monstermann/signals"
import { Line, List, Term, text } from "@monstermann/signals-tui"
import { Playlists } from "../Playlists"

export const list = List.create<SidebarItem>({
    height: memo(() => Term.height() - 2),
    width: 35,
    lines: memo(() => {
        const result: SidebarItem[] = [
            { isSelectable: false, title: "Home", type: "header" },
            { title: "Library", type: "library" },
            { title: "Recently Added", type: "recently_added" },
            { title: "Unsorted", type: "unsorted" },
            { isSelectable: false, title: "Playlists", type: "header" },
        ]
        for (const playlist of Playlists.$all())
            result.push({ type: "playlist", value: playlist })
        return result
    }),
    renderLine({ data, isSelected }) {
        let line: Text[] = []

        if (data.type === "header") {
            line.push(text(data.title, { fg: "blue" }))
        }
        else if (data.type === "playlist") {
            line.push(text(data.value.title))
        }
        else {
            line.push(text(data.title))
        }

        line = Line.fillRight(line, list.width())
        line = Line.truncateRight(line, list.width())
        if (isSelected) line = Line.mergeStyle(line, { bg: "black" })

        return line
    },
})
