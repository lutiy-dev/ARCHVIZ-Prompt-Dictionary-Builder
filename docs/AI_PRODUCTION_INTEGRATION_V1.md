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

## Adapter & MCP protocol checkpoint (single-stage PR #24)
Code included without changing deployed Pages or the legacy storage:
- `src/production/comfyui-adapter.mjs`: loopback-only read-only health/node inventory, explicit API graph validator against provided node definitions. Queue execution deliberately BLOCKED. Node validation is a LAB subset, not schema-complete ComfyUI compatibility.
- `src/production/openai-adapter.mjs`: builds structured recommendation-only requests. Explicit model selection, max-output-token cap, `store:false`, and user approval before any request. Credentials must be provided only by a trusted backend. Real API/network NOT TESTED.
- `src/production/skills-router.mjs`: pinned allowlisted GitHab-Skills text source, network fetch requires opt-in. It does not execute Skill instructions, and byte-integrity verification is NOT YET IMPLEMENTED.
- `src/production/history-store.mjs`: independent `archviz-production-history-v1` localStorage contract, bounded validation, export, fail-closed corrupted-state preservation. Existing keys unmodified; UI is still session-only.
- `src/production/mcp-sidecar.mjs`: actual Node 22+ MCP stdio JSON-RPC LAB server with three read-only, pure calculation tools: `prepare_archviz_task`, `review_geometry_metrics`, `validate_comfy_prompt`. No HTTP listener, shell, disk IO, images or model execution.
- `src/production/adapters.test.mjs`, `src/production/mcp-sidecar.test.mjs`: deterministic mocked-adapter tests plus a real MCP stdio subprocess handshake.

MCP smoke command (requires Node 22 installed):
`node src/production/mcp-sidecar.mjs`
Connect only through MCP stdio; the server is **not** an automatically launched Tauri sidecar nor a production-ready installer. Tests use synthetic metadata, not user's real models, paths or client media.

**Still not implemented**: Windows Tauri binary or automatic sidecar startup; secure user consent boundary for actual ComfyUI queue; real OpenAI API invocation; geometry image registration/diff model; interactive persistent History UI; final integrated cabinet acceptance. Single-stage release gate remains OPEN. No billing or external actions during tests.

## Persistent History UI checkpoint
The LAB History cabinet now reads and writes only `archviz-production-history-v1`, independently from legacy keys. Corrupt history is not overwritten; its error is visible and export is disabled until recovery. History survives a browser reload, but not cross-device and not browser-data clearing. PWA shell cache v6 includes this module; CI includes browser regression for separate history key. No changes to existing Standard/Video Director data.

## Desktop LAB launcher checkpoint — Node-based, NOT a Tauri build
A minimal dependency-free Windows/test launcher now exists at `tools/desktop-lab.mjs` with `tools/start-desktop-lab.cmd`. Requires Node 22+ preinstalled. It starts a child `src/production/mcp-sidecar.mjs`, performs a real private stdio MCP initialize and tools/list handshake, binds the existing static application to an OS-assigned **127.0.0.1** port and opens the system browser. Browser has NO exposed MCP API endpoint. SIGINT/SIGTERM closes the HTTP server and owned child process. A separate Node integration test exercises actual child process and HTTP serving. The project still has NO Windows installer and NO packaged Tauri binary; do not declare Desktop Fresh Install PASS.
Safety: GET/HEAD-only static server, allowlisted asset types, request path and symlink escape checks, max 12 MB assets, CSP, no cache, no keys, no automatic tool execution. Node development launcher is not a production-hardened authentication boundary, and installed local browser access is not password-protected.
OpenAI, ComfyUI and image Geometry Guardian runtime remain NOT TESTED. Desktop LAB should never be exposed through a router or remote proxy.

## Geometry Guardian local image-diff LAB checkpoint
A pair of local PNG/JPEG/WebP images can now be compared in-browser using Canvas without network upload. The module produces a changed-pixel ratio and red overlay. This is **not a geometry/edge/landmark validation algorithm**: color or lighting change triggers it, misalignment invalidates a reliable comparison, and pixel equality does not establish geometry preservation. Both input images must match resolution, maximum 8 MP processed and maximum 30MB per file. It ALWAYS returns `REVIEW_REQUIRED`. Automated architectural Accept is forbidden until calibrated image benchmark and masks are implemented. CI includes deterministic pixel-diff test and actual Chromium UI presence test. PWA cache v7 includes the module.

## Tauri 2 source checkpoint (not Windows tested)
Tauri 2 Rust source and native Rust MCP read-only diagnostic sidecar were added in `src-tauri/`. `desktop_status` is the only permitted frontend IPC command. Packaging uses official externalBin, Windows x64 only, with build-generated icon and binary. No user Node requirement at runtime. Linux static asset assembly tests do not imply a working Windows installer, Tauri runtime, Sidecar lifecycle, ComfyUI/OpenAI integration or production readiness. Keep PR Draft until Windows build and physical fresh-install PASS.

## Controlled ComfyUI queue adapter checkpoint
`src/production/comfyui-execution.mjs` adds a server-only explicit two-step stage → approve → queue gate. Stage clones the original API prompt and validates node dependencies against supplied object_info. The approval binds a SHA-256 digest to the graph, and is consumed before any network await. The adapter only posts to loopback /prompt and only after userConfirmed=true through a trusted UI. It does not change installed models, node class, seed or denoise values. It can query /history/{id} with constrained identifiers but has not been wired to the PWA or Tauri UI; no real generation occurred. No model inventory benchmark or output image has been retrieved. The connection is still NOT TESTED on actual ComfyUI. This is a tested LAB server-side API gate and **does not complete ComfyUI runtime acceptance**.

## Skills Router Git blob integrity checkpoint
The server-side Skills Router can now verify the exact Git blob SHA-1 obtained independently from a pinned GitHub tree entry. A mismatching fetched Skill is blocked. Without a trusted expectedBlobSha it remains SOURCE_FETCHED_AT_PINNED_SHA and verified_source_integrity=false; no tool execution is ever granted by the Skill content. Actual live skill discovery/execution remains a separate runtime gate.

## Protected-region edge QC checkpoint
A separate LAB module `src/production/edge-qc.mjs` computes Sobel edge evidence within an explicit one-channel protected-area mask on strictly same-size prealigned RGBA frames. It reports missing and unexpected edge ratios with a configurable tolerance. Synthetic tests include a uniform lighting shift (no extra false mismatch) and moved rectangular geometry (detected advisory mismatch). Masks must come from trusted Corona ID/manual selection; there is no automatic landmark alignment and no calibrated real-render benchmark yet. Output always REVIEW_REQUIRED, geometry_verified=false and alignment_verified=false.

## Windows CI first failure and correction
On the first Windows Tauri CI, `cargo` failed because Tauri build.rs required `binaries/ovizlab-mcp-x86_64-pc-windows-msvc.exe` before it had been compiled. Root cause: sidecar was declared inside Tauri Cargo package itself. Correction candidate moves the same Rust source to an independently compiled `src-mcp` crate and stages its binary before invoking the Tauri bundler. This is a change to packaging only; Windows rebuild must pass before any INSTALLER PASS statement.

## ComfyUI model inventory check
Before a user approves a queue request, the execution gate checks supported loader-name inputs (`ckpt_name`, `lora_name`, `vae_name`, `unet_name`, `clip_name`, `control_net_name`, etc.) against exact `object_info` choice lists. Legacy list choices and newer COMBO options are supported. Missing choices or a substituted/absent model cause BLOCKED; no model download or substitution. Unknown custom loaders are not proof of verified dependencies. Tests are synthetic; real installed model inventory has not been obtained.

## Art Director structured-response candidate checkpoint
OpenAI request builder now sends an explicit strict JSON schema for improvement proposals, geometry risk and human review. Server adapter parses response into `CANDIDATE_REVIEW_REQUIRED`; it never edits original projects or declares geometry PASS. A real API call is still gated by the existing billing consent and was NOT run in this checkpoint. Schema contract is validated with synthetic tests. Actual AI UI interaction, secure OS credential storage and approved live model execution remain BLOCKED.

## AI Art Director Accept/Reject checkpoint
The Art Director LAB can stage strict AI Candidate JSON locally and explicitly ACCEPT or REJECT its recommendations, recording the decision in the isolated history key. A candidate is bound to the current task; risky proposals under HARD lock require a separate manual review acknowledgement. It NEVER edits the original project or claims geometry has been validated. A real OpenAI API invocation and Video Director write-back are still NOT TESTED. Service Worker cache v9 includes this offline review feature.
