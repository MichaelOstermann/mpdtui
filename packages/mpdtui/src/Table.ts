const segmenter = new Intl.Segmenter()

export namespace Table {
    export interface Column<T extends string> {
        minWidth?: number
        name: T
        reserved?: boolean
    }

    interface Config<T extends string> {
        available: number
        columns: readonly Column<T>[]
        measurements: Record<T, number[]>
    }

    export function layout<T extends string>({ available, columns, measurements }: Config<T>): Record<T, number> {
        const cols = columns.map((col) => {
            const values = measurements[col.name]
            const original = max(values)
            const min = col.minWidth ?? 0
            const width = col.reserved ? original : max(removeOutliers(values))
            return { min, name: col.name, original, reserved: !!col.reserved, width: Math.max(width, min) }
        })

        const adjustable = cols.filter(col => !col.reserved)
        let current = cols.reduce((sum, col) => sum + col.width, 0)

        while (current < available) {
            const target = adjustable.reduce<typeof cols[number] | undefined>((acc, col) => {
                if (col.width >= col.original) return acc
                if (!acc) return col
                return acc.width < col.width ? acc : col
            }, undefined)
            if (!target) break
            target.width += 1
            current += 1
        }

        while (current > available) {
            const target = adjustable.reduce<typeof cols[number] | undefined>((acc, col) => {
                if (col.width <= col.min) return acc
                if (!acc) return col
                return acc.width > col.width ? acc : col
            }, undefined)
            if (!target) break
            target.width -= 1
            current -= 1
        }

        // Share whatever is left over evenly.
        for (let i = 0; current < available && adjustable.length; i++, current++)
            adjustable[i % adjustable.length]!.width += 1

        return Object.fromEntries(cols.map(col => [col.name, col.width])) as Record<T, number>
    }

    export function cell(value: string, width: number, align: "left" | "right" = "left"): string {
        let text = value
        let size = Bun.stringWidth(text)

        if (size > width) {
            text = ""
            size = 0
            for (const { segment } of segmenter.segment(value)) {
                const next = Bun.stringWidth(segment)
                if (size + next > width - 1) break
                text += segment
                size += next
            }
            if (width > 0) {
                text += "…"
                size += 1
            }
        }

        const padding = " ".repeat(Math.max(0, width - size))
        return align === "right" ? padding + text : text + padding
    }
}

function removeOutliers(values: number[]): number[] {
    if (!values.length) return values
    const sorted = values.toSorted((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]!
    const q3 = sorted[Math.floor(sorted.length * 0.75)]!
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    return values.filter(x => x >= lowerBound && x <= upperBound)
}

function max(values: number[]): number {
    return values.reduce((a, b) => Math.max(a, b), 0)
}
