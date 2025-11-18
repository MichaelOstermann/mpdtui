import { memo } from "@monstermann/signals"
import { Line, List, Term } from "@monstermann/signals-tui"
import { $current } from "../Status/$current"
import { table } from "./table"

export const list = List.create({
    col: table.col,
    height: memo(() => Term.height() - 2),
    lines: table.lines,
    renderLine({ data, isSelected }) {
        let line = data.line
        if (isSelected) line = Line.mergeStyle(line, { bg: "black" })
        if ($current().file === data.data.file) line = Line.mergeStyle(line, { fg: "magenta" })
        return line
    },
})
