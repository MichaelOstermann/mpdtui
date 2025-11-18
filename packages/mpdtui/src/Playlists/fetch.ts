import type { Playlist } from "../Playlist"
import { client } from "../client"

export async function fetch(): Promise<Playlist[]> {
    const playlists: Playlist[] = []
    for (const { playlist } of await client.api.playlists.get() as { last_modified: string, playlist: string }[]) {
        const files = (await client.api.playlists.list(playlist) as { file: string }[])
            .map(data => data.file)
            .filter(file => !!file)
        playlists.push({ files, title: playlist })
    }
    return playlists.sort((a, b) => a.title.localeCompare(b.title))
}
