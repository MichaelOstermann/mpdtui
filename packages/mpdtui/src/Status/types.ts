export interface Status {
    consume: boolean
    duration?: number
    elapsed?: number
    file?: string
    lastloadedplaylist: ""
    mixrampdb: number
    nextsong: number
    nextsongid: number
    partition: string
    playlist: number
    playlistlength: number
    random: boolean
    repeat: boolean
    single: boolean
    song: number
    songid: number
    state: "stop" | "play" | "pause"
    volume: number
}
