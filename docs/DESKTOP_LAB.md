# Windows Desktop LAB — Node Host + Private MCP stdio

Status: GENERATED / requires real Windows runtime test. NOT a standalone Windows installer or Tauri 2 release.

## Requirements
Node.js 22+ installed and available on PATH. No Python, model, ComfyUI or OpenAI key required to test startup. Browser is launched from the local machine, and the existing site is served without changes to the GitHub Pages release.

## Launch
On Windows run `tools\\start-desktop-lab.cmd` from a checked-out repository. Equivalently: `node tools/desktop-lab.mjs` from the repo root. For an automated test without opening a browser: `node tools/desktop-lab.mjs --no-browser`. The process announces `LAB_READY` plus a local loopback URL and the three whitelisted MCP tools. Port is allocated automatically. Do not forward this URL or expose it over a network.

## Lifecycle and safety
The launcher first spawns `src/production/mcp-sidecar.mjs` as its own child process, checks MCP initialize and tools/list over private stdin/stdout, serves the existing static frontend on 127.0.0.1 and opens the system browser. Press Ctrl+C to stop the host; it closes HTTP and terminates only its own child. On Windows closing the launcher console abruptly may terminate the parent before managed cleanup; verify no orphan process remains before claiming lifecycle PASS.

Web frontend is not connected to the MCP stream, cannot perform unapproved execution and has no API credentials. ComfyUI and OpenAI adapters remain opt-in and not wired to UI. Browser UI is not authenticated: it is local-only development tooling, not a client portal.

## Verification and rollback
Run `node --check tools/desktop-lab.mjs` and `node --test tools/desktop-lab.test.mjs`. CI performs a real Node child-process MCP handshake and HTTP smoke on Linux; this does not prove Windows browser launch, process shutdown or installer behavior. On Windows manually check: LAB_READY -> browser loads -> Standard and Video Director switch -> Ctrl+C -> local URL stops responding -> no owned child remains. If any check fails, STOP, preserve logs, revert feature branch changes; `main` remains the verified baseline.

## Missing for final v1.0
Tauri 2 bundling (requires pinned dependencies and compiler validation), no-Node distribution, auto-start in packaged app, real OpenAI authorization, ComfyUI generation tests, image geometry QC and final product acceptance.
