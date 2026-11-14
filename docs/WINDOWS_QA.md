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
