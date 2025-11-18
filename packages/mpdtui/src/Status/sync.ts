import { $current } from "./$current"
import { fetch } from "./fetch"

export function sync(): void {
    fetch()
        .then(status => $current(status))
        .then(() => setTimeout(sync, 100))
}
