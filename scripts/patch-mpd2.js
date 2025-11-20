#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs"

const FILE = "node_modules/mpd2/lib/parsers.js"

if (!existsSync(FILE)) {
    console.log("mpd2 not installed, skipping patch")
    process.exit(0)
}

let content = readFileSync(FILE, "utf8")

// Check if already patched
if (content.includes("if (parent && parent[key] === undefined)")) {
    console.log("mpd2 already patched")
    process.exit(0)
}

console.log("Patching mpd2...")

// Apply the fix
const originalCode = `    // new non top accumulator entry
    } else if (keyIdx !== -1) {
      let parent = memo.objpath[keyIdx - 1]
      if (parent[key] === undefined) {
        parent[key] = []
      }

      parent[key].push(obj)
      memo.objpath[keyIdx] = obj`

const patchedCode = `    // new non top accumulator entry
    } else if (keyIdx !== -1) {
      let parent = memo.objpath[keyIdx - 1]
      if (parent && parent[key] === undefined) {
        parent[key] = []
      }

      if (parent) {
        parent[key].push(obj)
      }
      memo.objpath[keyIdx] = obj`

if (!content.includes(originalCode)) {
    console.error("Error: Could not find code to patch. mpd2 may have been updated.")
    process.exit(1)
}

content = content.replace(originalCode, patchedCode)
writeFileSync(FILE, content, "utf8")

console.log("mpd2 patched successfully")
