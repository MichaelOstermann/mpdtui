import mpdapi from "mpd-api"

// eslint-disable-next-line antfu/no-top-level-await
export const client = await mpdapi.connect()
