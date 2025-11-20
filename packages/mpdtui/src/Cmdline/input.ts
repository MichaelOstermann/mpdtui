import { memo } from "@monstermann/signals"
import { Input, Term } from "@monstermann/signals-tui"

export const input = Input.create({
    row: memo(() => Term.height() - 1),
})
