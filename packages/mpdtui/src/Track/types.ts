export interface Track {
    added: string
    album: string
    albumartist: string
    artist: string
    date: string
    disc: number
    duration: number
    file: string
    genre: string
    last_modified: string
    time: number
    title: string
    track: number
    format: {
        bits: string
        channels: number
        original_value: string
        sample_rate: number
        sample_rate_short: {
            unit: string
            value: number
        }
    }
}
