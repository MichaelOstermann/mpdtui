# mpdtui

A small, keyboard-driven music player for the terminal, backed by [mpd](https://www.musicpd.org).

Playlists on the left, their tracks on the right, and whatever is playing along the bottom.

## Features

- Browse the whole library, recently added tracks, tracks that are not in any playlist, and every stored playlist.
- Fuzzy-filter the current view by title, artist, or album.
- Add tracks to playlists, remove them again, and create, rename, or delete playlists.
- Select a range of tracks to act on several at once.
- Playback keeps running in mpd after the UI is closed.

## Install

Requires Bun 1.4.2 or later and a running mpd.

```sh
bun install -g @monstermann/mpdtui
```

Run `mpdtui`. It connects to `127.0.0.1:6600` unless `MPD_HOST` / `MPD_PORT` say otherwise.

## Navigation

| Key                     | Action                                      |
| ----------------------- | ------------------------------------------- |
| `j` / `k` or arrow keys | Move the selection                          |
| `Ctrl+d` / `Ctrl+u`     | Move half a page down / up                  |
| `g` / `G`               | Jump to the first / last item               |
| `Enter`                 | Open the selected playlist, play a track    |
| `Escape`                | Clear the selection or filter, then go back |
| `Tab`                   | Switch between playlists and tracks         |
| `/`                     | Filter the current view                     |
| `q`                     | Quit                                        |

## Playback

| Key           | Action                                   |
| ------------- | ---------------------------------------- |
| `p` / `Space` | Play / pause                             |
| `<` / `>`     | Previous / next track                    |
| `b` / `f`     | Seek 5s back / forward                   |
| `t`           | Seek to a time, e.g. `1:30` or `1:02:03` |
| `,` / `.`     | Volume down / up                         |
| `x`           | Toggle shuffle                           |
| `z`           | Toggle repeat                            |
| `s`           | Toggle single                            |
| `S`           | Stop                                     |
| `u`           | Update the mpd database                  |

Clicking the progress bar seeks to that position, double-clicking a track or playlist plays it.

Playback shortcuts are shown along the bottom on the left, actions for the focused list on the right.
