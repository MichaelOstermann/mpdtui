import type { Track } from "../Track"
import type { Status } from "./types"
import { client } from "../client"

export async function fetch(): Promise<Status> {
    const [status, track] = await Promise.all([
        client.api.status.get() as Promise<Status>,
        client.api.status.currentsong() as Promise<Track | undefined>,
    ])

    return {
        ...status,
        file: track?.file,
    }
}
