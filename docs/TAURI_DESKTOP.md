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
