import type { ReactNode } from "react"
import { batch, peek, signal } from "@monstermann/signals"
import { useKeyboard } from "@opentui/react"
import { Keys } from "./Keys"
import { State } from "./State"
import { theme } from "./theme"

interface Question {
    prefix: string
    value?: string
    hint?: (value: string) => string
    onCancel?: () => void
    onInput?: (value: string) => void
    onSubmit: (value: string) => unknown
}

let pending: { fallback: boolean, resolve: (ok: boolean) => void } | undefined
let question: Question | undefined

export namespace Commandline {
    export const $prefix = signal("")
    export const $value = signal("")
    export const $hint = signal("")
    export const $focused = signal(false)
    export const $busy = signal(false)
    export const $prompt = signal("")
    export const $output = signal("")

    export function run(action: () => unknown): void {
        $output("")
        Promise.try(action).catch((error: unknown) => $output(error instanceof Error ? error.message : String(error)))
    }

    export function confirm(prompt: string, fallback: boolean): Promise<boolean> {
        const answered = new Promise<boolean>((resolve) => {
            pending = { fallback, resolve }
        })
        batch(() => {
            $prompt(prompt)
            $focused(true)
        })
        return answered
    }

    function answer(ok: boolean): void {
        batch(() => {
            $prompt("")
            $focused(false)
        })
        pending?.resolve(ok)
        pending = undefined
    }

    export function ask(options: Question): void {
        question = options
        batch(() => {
            $prefix(options.prefix)
            $value(options.value ?? "")
            $hint(options.hint?.(options.value ?? "") ?? "")
            $focused(true)
        })
    }

    function close(): void {
        question = undefined
        batch(() => {
            $prefix("")
            $value("")
            $hint("")
            $focused(false)
        })
    }

    function input(value: string): void {
        batch(() => {
            $value(value)
            $hint(question?.hint?.(value) ?? "")
        })
        question?.onInput?.(value)
    }

    function submit(): void {
        const value = peek($value)
        const onSubmit = question?.onSubmit
        close()
        run(async () => {
            $busy(true)
            try {
                await onSubmit?.(value)
            }
            finally {
                $busy(false)
            }
        })
    }

    export function Root(): ReactNode {
        const focused = $focused()
        const prefix = $prefix()
        const value = $value()
        const hint = $hint()
        const output = $output()
        const prompt = $prompt()
        const filter = State.$filter()

        useKeyboard((key) => {
            if (peek($prompt)) {
                key.stopPropagation()
                if (key.sequence === "y") answer(true)
                else if (key.sequence === "n") answer(false)
                else if (key.name === "return") answer(pending!.fallback)
                else if (key.name === "escape") answer(false)
                return
            }
            if (peek($focused)) {
                if (key.name === "escape") {
                    key.stopPropagation()
                    const onCancel = question?.onCancel
                    close()
                    onCancel?.()
                }
                return
            }
            const binding = peek(Keys.$panel).find(item => item.key === key.sequence)
            if (binding) run(binding.run)
        })

        if (prompt) {
            return (
                <box style={{ flexDirection: "row", flexShrink: 0, height: 1 }}>
                    <text fg={theme.yellow} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{`${prompt} `}</text>
                    <text fg={theme.white} selectable={false} style={{ flexGrow: 1 }} wrapMode="none">{pending?.fallback ? "[Y/n]" : "[y/N]"}</text>
                </box>
            )
        }

        if (!focused) {
            return (
                <box style={{ flexDirection: "row", flexShrink: 0, height: 1 }}>
                    <text fg={theme.white} selectable={false} style={{ flexGrow: 1 }} wrapMode="none">{output || (filter && `/${filter}`)}</text>
                </box>
            )
        }

        return (
            <box style={{ flexDirection: "row", flexShrink: 0, height: 1 }}>
                <text fg={theme.foreground} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{prefix}</text>
                <input
                    focused
                    onInput={input}
                    onSubmit={submit}
                    style={{ flexGrow: 1, focusedTextColor: theme.foreground, textColor: theme.foreground }}
                    value={value}
                />
                <text fg={theme.white} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{hint}</text>
            </box>
        )
    }
}
