import { describe, expect, test } from "bun:test"
import { Table } from "../src/Table"

const columns = [
    { name: "title" },
    { name: "artist" },
    { name: "duration", reserved: true },
] as const

describe("Table.layout", () => {
    test("fills the available width", () => {
        const widths = Table.layout({
            available: 40,
            columns,
            measurements: { artist: [5, 6], duration: [4, 4], title: [10, 12] },
        })
        expect(widths.duration).toBe(4)
        expect(widths.title + widths.artist + widths.duration).toBe(40)
    })

    test("shrinks the widest column first and never the reserved ones", () => {
        const widths = Table.layout({
            available: 20,
            columns,
            measurements: { artist: [6, 6], duration: [5, 5], title: [30, 30] },
        })
        expect(widths).toEqual({ artist: 6, duration: 5, title: 9 })
    })

    test("ignores outliers until there is room for them", () => {
        const title = [10, 10, 10, 10, 10, 10, 10, 60]
        const measurements = { artist: title.map(() => 10), duration: title.map(() => 4), title }
        expect(Table.layout({ available: 24, columns, measurements }).title).toBe(10)
        expect(Table.layout({ available: 74, columns, measurements }).title).toBe(60)
    })

    test("handles empty tables", () => {
        const widths = Table.layout({ available: 10, columns, measurements: { artist: [], duration: [], title: [] } })
        expect(widths).toEqual({ artist: 5, duration: 0, title: 5 })
    })
})

describe("Table.cell", () => {
    test("pads and truncates to the given width", () => {
        expect(Table.cell("abc", 5)).toBe("abc  ")
        expect(Table.cell("abc", 5, "right")).toBe("  abc")
        expect(Table.cell("abcdef", 5)).toBe("abcd…")
        expect(Table.cell("日本語", 5)).toBe("日本…")
        expect(Table.cell("abc", 0)).toBe("")
    })
})
