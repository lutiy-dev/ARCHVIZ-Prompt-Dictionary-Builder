# Windows Tauri 2 · BETA CANDIDATE SOURCE ONLY

The source for Tauri 2.12.5 and a separate native Rust MCP stdio executable is provided for Windows x64. End users do not need Node.js, but build machines need Node 22+, Rust >=1.90, Microsoft C++ build tools, WebView2 and Tauri CLI.

## Building (Windows x64)
1. `node tools/prepare-desktop.mjs --assets-only` verifies copy of required offline static assets and creates icon inputs.
2. `npx --yes @tauri-apps/cli@2.12.2 build` launches `beforeBuildCommand`, builds a native MCP sidecar with Cargo, bundles it using Tauri `externalBin`, and builds the NSIS installer.
3. Inspect `src-tauri/target/release/bundle/nsis/` and test in an isolated Windows system.

No application icon or bundle binary is checked into Git; generated icon comes from existing licensed project image at `icons/icon-192.png`. The build is not a published release and no installer is uploaded to Releases automatically.

## Architecture and restrictions
The Rust sidecar only exposes `runtime_info`, a read-only diagnostic MCP tool. The desktop backend owns the process; JavaScript cannot spawn arbitrary tools. The frontend remains shared with Pages/PWA and calls a restricted `desktop_status` Tauri command when available. OpenAI and ComfyUI calls are still unconnected in Tauri. There is no API-key storage or externally reachable backend. Desktop build and Windows lifecycle must be proven by Windows CI and physical device testing before BETA READY.

If the sidecar crashes, UI remains available but status is NOT READY; no auto-restart or external execution is attempted.

STOP before shipping or enabling real execution if packaging fails, Sidecar does not terminate on window close, or any security/privacy regression is found.

## Windows build root-cause fix
The MCP binary is built from a separate `src-mcp` Rust crate before Tauri packaging. Building it from the Tauri Cargo package created a dependency cycle: the Tauri build script required `externalBin` before the sidecar existed. The dedicated crate breaks that cycle. Verify actual Windows CI before calling this fixed.

## Native MCP binary runtime smoke
After successful Windows packaging, CI executes the exact bundled sidecar executable through stdio, checks initialize, tools/list, a read-only runtime_info call and explicit rejection of an unknown tool. This verifies the binary protocol, not Tauri app GUI launch or automatic Sidecar lifecycle on a user's Windows device.

### Read-only ComfyUI health button
In AI Production > MCP / ComfyUI, click `Probe local ComfyUI :8188 · read-only`. On the Desktop runtime this calls a fixed loopback TCP health check from Rust; in the Web/PWA it safely returns BLOCKED. A `CONNECTED_UNVERIFIED` response only establishes an HTTP 200 status, not available models or a successful render. No queue permission is granted.

### Automatic local ComfyUI discovery

Desktop no longer assumes a fixed ComfyUI port. `AI Production > MCP / ComfyUI` now asks the native backend to inspect **local Windows TCP listeners only**. The discovery order prioritizes `127.0.0.1:8000` (common Desktop) and `127.0.0.1:8188` (common standalone), then checks locally listening TCP ports reported by Windows. It never scans LAN/WAN addresses.

A candidate is accepted only when the loopback endpoint returns HTTP 200 for both `/system_stats` and `/object_info`, with `/system_stats` containing expected ComfyUI fields. Discovery starts automatically when the **MCP / ComfyUI** cabinet opens; the **Re-detect** control only repeats the same read-only check. Result status is still `CONNECTED_UNVERIFIED`: this verifies the local API identity/readiness only, not models, custom nodes, queue execution or render success. Generation remains disabled. A manual **localhost port** fallback is available when auto-discovery fails. No ComfyUI settings or process are modified.
