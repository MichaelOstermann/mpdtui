import type { Text } from "@monstermann/signals-tui"
import { Line, Term, text } from "@monstermann/signals-tui"
import { Status } from "../Status"
import { Track } from "../Track"
import { Tracks } from "../Tracks"

export function render() {
    const s = Status.$current()

    const left: Text[] = []
    if (s.single) left.push(text("󰑘  "))
    if (s.repeat) left.push(text("  "))
    if (s.random) left.push(text("  "))

    const duration = s.duration ?? 0
    const elapsed = s.elapsed ?? 0
    const right: Text[] = [
        text(Track.formatDuration(elapsed)),
        text(" / "),
        text(Track.formatDuration(duration)),
    ]

    const track = Tracks.$all().find(t => t.file === s.file)
    const parts = [track?.title, track?.artist].filter(v => !!v).join(" - ")
    let middle = [text(parts)]

    middle = Line.truncateRight(middle, Term.width() - Line.width(left) - Line.width(right) - 2)
    middle = Line.fillAround(middle, Term.width() - Line.width(left) - Line.width(right))

    Term.drawLine(Term.height() - 2, 0, [...left, ...middle, ...right])
}
