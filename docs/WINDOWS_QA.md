# ARCHVIZ Prompt Studio · Windows Fresh Install QC

Status: **TEST PLAN / NOT EXECUTED on a physical workstation**

## Preconditions
Use an isolated Windows test account or VM. Back up existing Prompt Studio projects and browser data before testing. Do not overwrite an active production installation. Keep the known-good `main` and the original GitHub Pages version available for rollback.

Retrieve the unsigned LAB NSIS candidate only from the matching GitHub Actions run and verify SHA-256 against the CI inventory output. This is not a signed trusted release. Do not bypass security software or modify Windows security settings for a failed installer.

## Acceptance checklist
- Installer launches and completes without installing Node.js for the end user.
- Application opens, renders Standard, Video Director and AI Production LAB.
- MCP status reports `STDIO READY` after handshake; unknown tools cannot execute.
- Reopening the application does not create orphaned copies of the owned Sidecar.
- Closing the application terminates only its owned Sidecar.
- Disconnected ComfyUI and missing OpenAI credentials do not crash or freeze UI.
- Legacy project import, export and browser storage remain unchanged.
- PWA continues to operate independently on the published GitHub Pages site.
- No API call, payment, model substitution, workflow queue or client-media upload happens without separate user confirmation.
- Keyboard navigation, focus and window resizing work at 1366×768 and 1920×1080.

## STOP/FAIL
STOP if installer artifacts are missing, sidecar remains orphaned, OS security settings require weakening, credentials appear in logs, a model/workflow is unexpectedly modified, or projects cannot be restored. Preserve exact version, Windows build, log excerpt, and steps to reproduce.

## Evidence boundary
Windows CI installer creation and bundled native MCP smoke are **build/runtime process evidence**, but cannot substitute physical fresh-install, Windows lifecycle, WebView focus and ComfyUI/AI end-to-end checks. Only promote to READY FOR REVIEW when all mandatory gates pass.

## 15 Nov 2026 — User Windows runtime BLOCKER: blank white WebView2

Observed on a physical Windows PC: the unsigned NSIS installer launches the `ARCHVIZ Prompt Studio · LAB` window, but the entire content area is white. **PHYSICAL WINDOWS UI = FAIL.** This overrides prior CI build success for any release/merge claims. The screenshot is symptom evidence only: exact cause (frontend asset routing, WebView2 navigation/runtime, rendering/GPU, CSP, cached resources) is NOT CONFIRMED.

A new CI step executes the built `ovizlab-prompt-studio.exe` under Windows WebView2 with localhost-only CDP diagnostic and asserts that real bundled Standard, Video Director and AI Production DOM roots load. The test never queues ComfyUI, uses paid APIs, changes models or writes project data. Failure or lack of a debugging connection is a **blocked gate**, not an implicit UI PASS. The CI test uses a process tree scoped to its spawned application for cleanup. `tools/test-windows-webview2.mjs` and `.github/workflows/desktop-windows.yml` own this gate.

Do not alter WebView2 security settings, disable CSP, change dependencies, overwrite local project data or merge main as a speculative workaround. Inspect the failed Windows job and physical workstation evidence before applying a minimal corrective change. Retest exact NSIS artifact on the same physical Windows configuration. Existing known-good main/Pages is the rollback.

## 15 November 2026 — installer artifact missing after UI smoke failure

Confirmed on Windows Actions run `43668045808`: Tauri compiled the release EXE and bundled `ARCHVIZ Prompt Studio_0.1.0_x64-setup.exe` (2.60 MiB), and native MCP smoke passed. The subsequent WebView2 CDP test failed (`WebView2 DevTools endpoint never appeared`). GitHub Actions then skipped the installer inventory and artifact upload because they used the default success-only condition. **This is a CI artifact publication error, not evidence that compilation failed.** The reason the Windows runner did not expose WebView2 CDP remains NOT CONFIRMED, and desktop runtime is NOT VERIFIED by CI.

The Windows workflow now runs installer inventory and uploads the unsigned LAB installer on failed smoke results, but **does not change the smoke test outcome** or release gate. The build run remains FAILURE when WebView2 UI cannot be verified. Never treat the presence of a downloadable installer as a Production PASS. Source/UI asset changes now also trigger the Windows build. Maintain Draft PR #24, no merge/release, preserve old installation/user data and retest on physical Windows.
