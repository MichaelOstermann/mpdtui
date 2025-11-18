import type { Track } from "../Track"
import { client } from "../client"

export async function fetch(): Promise<Track[]> {
    return (await client.api.db.listallinfo())
        .flatMap((data: any) => data.file as Partial<Track>)
        .filter(file => !!file)
        .map(track => ({
            added: "",
            album: "",
            albumartist: "",
            artist: "",
            date: "",
            disc: 0,
            duration: 0,
            file: "",
            genre: "",
            last_modified: "",
            time: 0,
            title: "",
            track: 0,
            format: {
                bits: "",
                channels: 0,
                original_value: "",
                sample_rate: 0,
                sample_rate_short: {
                    unit: "",
                    value: 0,
                },
            },
            ...track,
        }))
}
