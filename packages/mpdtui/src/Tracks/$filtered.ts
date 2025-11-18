import { memo } from "@monstermann/signals"
import { Cmdline } from "../Cmdline"
import { $all } from "./$all"
import { filter } from "./filter"

export const $filtered = memo(() => {
    const input = Cmdline.input.value()
    if (!input.startsWith("/") || input === "/") return $all()
    return filter($all(), input.slice(1))
})
