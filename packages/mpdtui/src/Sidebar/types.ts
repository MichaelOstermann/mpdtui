import type { Playlist } from "../Playlist"

export type SidebarItem =
    | { isSelectable: boolean, title: string, type: "header" }
    | { type: "playlist", value: Playlist }
    | { title: string, type: "library" }
    | { title: string, type: "recently_added" }
    | { title: string, type: "unsorted" }
