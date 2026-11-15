# ARCHVIZ Prompt Studio — Unified Design System v1.1

Status: **LAB / IMPLEMENTED CANDIDATE**. This is presentation-only. It is **not** a Production release or a change to AI execution contracts.

## Objective

Make Standard Prompt, Video Director, and all five AI Production cabinets feel like one application: one graphite/yellow palette, consistent width and gutters, headings, fields, cards, action emphasis, keyboard focus and responsive behavior.

## Source files and scope

- `src/design-system.css`: canonical **additive** design tokens and scoped UI overrides, loaded **after** legacy `src/style.css`.
- `index.html`: stylesheet link; no mode/data contract changes.
- `src/video-director/ui.mjs`: navigation metadata and five visual Shot Composer headings; original fields, actions, project JSON and event handlers remain intact.
- `src/production/ui.mjs`: semantic presentation classes for primary/review/danger actions and disabled state for Export Task before an actual task exists; original export function and permissions unchanged.
- `sw.js`: versioned offline cache includes the additional CSS file.
- `tools/test-video-director-browser.mjs`: responsive browser checks + screenshot evidence for Standard/Video/Production.

## Design rules

1. **Colors**: preserve graphite/yellow; existing `--card`, `--raised`, `--soft`, `--border`, `--yellow` remain authoritative. `--panel:var(--card)` repairs an undefined legacy alias, not a palette change.
2. **Width**: shared maximum workspace width `1680px` and a shared responsive gutter (12–32px). Header is unchanged; workspace context and navigation follow the shared horizontal rhythm.
3. **Typography**: active page title 25–36px; section headings 16–20px; labels 13px; technical metadata 11–12px; keep original fonts.
4. **Spacing**: `4 / 8 / 12 / 16 / 24 / 32px` semantic tokens; card radius 12px; field/control radius 6px.
5. **Action levels**: yellow for selected navigation or primary action; neutral for secondary/navigation/file exports; red border only for existing destructive/reject affordances. No privilege or confirmation changes.
6. **Video Director**: Shot List is **navigation**, not twelve yellow calls to action. Selected shot uses `aria-pressed` + yellow outline, normal shots neutral. Add Shot is visually distinct. Shot Composer fields are grouped with noninteractive headings (Shot/References/Camera/Lighting/Blocking).
7. **Production**: all five cabinets share the same layout. Inspector remains Summary/Issues/JSON/History with original machine-readable data. Geometry previews remain local advisory QC.
8. **Standard**: Library/Composer/Final Prompt preserve their existing DOM and algorithms. Card chrome and secondary buttons share the new visual rules.
9. **Accessibility**: preserve visible focus, button labels, semantic selection and existing keyboard paths. Reduced-motion preference remains respected.
10. **Responsive**: test 390, 800, 960, 1100, 1101, 1366 and 1920px in Chromium; physical Windows WebView2 at 100/125/150% display scale remains a separate mandatory gate.

## Compatibility and limits

No modifications to dictionary/preset content, prompt compiler, Video Director JSON schemas/storage, reference retention, model/seed/denoise, Architecture Lock, ComfyUI queue, OpenAI API, or MCP permissions. No new npm/Rust dependency, no migration.

## Acceptance and evidence

- Run `node --test src/*.test.mjs src/video-director/*.test.mjs src/production/*.test.mjs`.
- Run `node tools/test-video-director-browser.mjs`; CI additionally verifies offline PWA boot.
- Inspect screenshots from CI artifact `prompt-studio-ui-regression`: Standard, Video and AI Production at 960/1366/1920.
- Validate Windows Tauri NSIS build and `tools/test-windows-webview2.mjs` against the same commit.
- **Physical Windows runtime**: fresh install, all pages, no white screen, existing project round-trip, Tauri sidecar startup/shutdown and WebView2 scaling. Until that is recorded as PASS, keep PR #24 Draft and do not merge or publish.

## STOP conditions

Any blank native WebView2, new PWA offline failure, keyboard regression, unreadable/clipped inputs, unexpected CSS changes in compiler output, data loss or external model execution requires STOP and rollback to the known-good `main`. CI build success is not a substitute for physical Windows acceptance.
