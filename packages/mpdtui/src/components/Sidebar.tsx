import type { ReactNode } from "react"
import { batch, peek } from "@monstermann/signals"
import { Actions } from "../Actions"
import { Commandline } from "../Commandline"
import { State } from "../State"
import { theme } from "../theme"
import { List } from "./List"

export function Sidebar(): ReactNode {
    const views = State.$views()
    const focused = State.$focus() === "sidebar"

    return (
        <List
            $cursor={State.$sidebarCursor}
            $scrollTop={State.$sidebarTop}
            focused={focused}
            items={views}
            onOpen={() => Commandline.run(() => Actions.play(peek(State.$viewing), 0))}
            onPress={index => batch(() => {
                State.$sidebarCursor(index)
                State.$focus("sidebar")
            })}
            render={view => (
                <box style={{ flexDirection: "row", flexGrow: 1 }}>
                    <text fg={view.playlist ? theme.foreground : theme.blue} selectable={false} style={{ flexGrow: 1, flexShrink: 1 }} wrapMode="none">{view.title}</text>
                    {!!view.count && <text fg={theme.white} selectable={false} style={{ flexShrink: 0 }} wrapMode="none">{`  ${view.count}`}</text>}
                </box>
            )}
        />
    )
}
