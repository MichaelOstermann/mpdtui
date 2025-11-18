import { memo } from "@monstermann/signals"
import { Input, Key, Term } from "@monstermann/signals-tui"

export const input = Input.create({
    row: memo(() => Term.height() - 1),
    onKeypress(event) {
        Key.onShortcuts(event, {
            "<esc>": () => {
                event.stopPropagation()
                Input.reset(input)
                Input.blur(input)
            },
        })
    },
})
