# ARCHVIZ Prompt Studio — AI Production Integration v1.0

Status: **IN PROGRESS / FOUNDATION ONLY / NOT RELEASED**
Baseline main: \`c65ad742d49ae0410c82595f4b11bddcfb0c788d\`

## Unified acceptance boundary
One feature branch, one PR, one final acceptance for all cabinets: Standard, AI Art Director, Video Director, Geometry Guardian, Skills Router, MCP / ComfyUI, Production History. No partial production releases.

## Ground rules
- Keep Standard, Video Director and legacy storage schemas unchanged.
- Geometry truth remains 3ds Max / Corona; AI suggestions require explicit human review.
- Real backend, MCP tools, ComfyUI runtime, OpenAI API credentials and Tauri desktop packaging are **NOT IMPLEMENTED** by the foundation module.
- Existing Pages/PWA remains the production baseline until integration verification.
- No API secrets, client images, auto-execution or data migrations.

## Current foundation
\`src/production/core.mjs\` defines: versioned, non-executable tasks with default HARD architecture lock; exact skill SHA references; deny-by-default tool-call policy; honest connected/verified/tested statuses; append-only history helper; preliminary QC review. It has no DOM, network or filesystem side effects. The QC thresholds (2 pixels registration error, 1.5% contour mismatch) are **illustrative LAB values only**, not calibrated industry thresholds, and **never** produce an automatic PASS or ACCEPTED result.

## Remaining mandatory work before PR acceptance
Implement and verify integrated UI for all cabinets; secure Windows local sidecar lifecycle and MCP adapters; authenticated OpenAI integration; real ComfyUI health/workflow validation/approved execution; reference-safe image QC against labelled cases; production history persistence; portable Windows desktop package; security and browser/device regression tests; actual deployed artifact; documentation and rollback.

## Gates
\`node --check src/production/core.mjs\`
\`node --test src/production/core.test.mjs\`
Existing CI and browser/PWA tests must remain green. These tests alone do not satisfy v1.0 integration acceptance.

STOP on any unknown migration, model substitution, unsafe tool privilege, unverified executable download, leaked key, live-side-effect request or loss of the verified baseline.

## Additive UI checkpoint

The new AI Production LAB tab contains five independent cabinet panels: Art Director (local non-executable tasks), Geometry Guardian (manual advisory metrics), Skills (SHA metadata format validation only), MCP / ComfyUI (explicitly disconnected and deny-by-default tool dry-run), and session-only History export. No calls to OpenAI, MCP, ComfyUI or any external service. The standard saved-project keys are unchanged. This is a prototype surface, not completion of v1.0. Service Worker precache version advances to include the two new modules.
