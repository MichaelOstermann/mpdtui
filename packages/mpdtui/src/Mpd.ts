import { connect } from "node:net"

export namespace Mpd {
    export type Pairs = [key: string, value: string][]

    interface Connection {
        send: (commands: string[]) => Promise<Pairs[]>
    }

    const host = process.env["MPD_HOST"] || "127.0.0.1"
    const port = Number(process.env["MPD_PORT"]) || 6600

    let main: Promise<Connection> | undefined

    export function command(name: string, ...args: (string | number)[]): string {
        return [name, ...args.map(arg => quote(String(arg)))].join(" ")
    }

    export function quote(value: string): string {
        return `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`
    }

    export async function run(...commands: string[]): Promise<Pairs[]> {
        // mpd drops connections that sit unused for a while.
        main ??= open(() => main = undefined)
        return (await main).send(commands)
    }

    export async function idle(subsystems: string[], onChange: (changed: string[]) => void): Promise<never> {
        const connection = await open()
        while (true) {
            const [pairs = []] = await connection.send([["idle", ...subsystems].join(" ")])
            onChange(pairs.map(([, value]) => value))
        }
    }

    function open(onClose?: () => void): Promise<Connection> {
        return new Promise((resolve, reject) => {
            const socket = host.startsWith("/") ? connect(host) : connect(port, host)
            const queue: { reject: (error: Error) => void, resolve: (groups: Pairs[]) => void }[] = []
            let groups: Pairs[] = [[]]
            let buffer = ""

            const connection: Connection = {
                send(commands) {
                    if (!commands.length) return Promise.resolve([])
                    return new Promise((resolve, reject) => {
                        queue.push({ reject, resolve: groups => resolve(groups.slice(0, commands.length)) })
                        if (commands.length === 1) socket.write(`${commands[0]}\n`)
                        else socket.write(`command_list_ok_begin\n${commands.join("\n")}\ncommand_list_end\n`)
                    })
                },
            }

            function fail(error: Error): void {
                reject(error)
                for (const entry of queue.splice(0)) entry.reject(error)
            }

            // The greeting resolves the connection itself.
            queue.push({ reject, resolve: () => resolve(connection) })

            socket.unref()
            socket.setEncoding("utf8")
            socket.on("error", () => fail(new Error(`Could not connect to mpd at ${host.startsWith("/") ? host : `${host}:${port}`}`)))
            socket.on("close", () => {
                onClose?.()
                fail(new Error("Lost connection to mpd"))
            })
            socket.on("data", (chunk: string) => {
                const lines = (buffer + chunk).split("\n")
                buffer = lines.pop() ?? ""
                for (const line of lines) {
                    if (line === "OK" || line.startsWith("OK MPD ")) {
                        queue.shift()?.resolve(groups)
                        groups = [[]]
                    }
                    else if (line.startsWith("ACK ")) {
                        queue.shift()?.reject(new Error(line.replace(/^ACK \[.*?\] (?:\{.*?\} )?/, "")))
                        groups = [[]]
                    }
                    else if (line === "list_OK") {
                        groups.push([])
                    }
                    else {
                        const at = line.indexOf(": ")
                        if (at > 0) groups.at(-1)!.push([line.slice(0, at), line.slice(at + 2)])
                    }
                }
            })
        })
    }
}
