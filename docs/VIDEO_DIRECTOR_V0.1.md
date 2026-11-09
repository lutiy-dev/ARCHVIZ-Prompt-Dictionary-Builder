# Video Director v0.1 — BETA candidate

## Architecture

Separate Standard and Video Director workspaces. The legacy `src/composer.mjs`, existing 127 blocks / 46 presets and both legacy localStorage keys remain untouched.

The implementation is additive under `src/video-director/`:

- `schema.mjs`: versioned project schema, reference and character validation, 12-shot synthetic demo.
- `store.mjs`: JSON transfer and isolated browser storage key `archviz-video-director-v1`.
- `compiler.mjs`: deterministic shot text and reference map for Generic, MiniMax H3 FL2VA / Ref2VA and LongMedia Hybrid / Video Ref Edit.
- `ui.mjs`: independent project, shots, actors, references, camera presets and layered instructions.
- `mode-tabs.mjs`: Standard / Video Director switching.

## User workflow

1. Select Video Director and create a new project or load the synthetic NABEREJNAYA demo.
2. Add reference **metadata** and roles. This app does not upload images, video or audio.
3. Define project characters and identity reference IDs, and select a shot.
4. Set FIRST/LAST, movement video, actors, lens, camera preset, actions and editable instructions.
5. Review the compiled English prompt and diagnostics. Fix errors before exporting shot manifest.
6. Copy the prompt and reference manifest to your ComfyUI workflow and manually connect actual media in the displayed order.
7. Export project JSON for backup. Import rejects conflicting project IDs instead of overwriting.

## Adapter limitations

The application produces a **text plus manifest**. It does not generate a ComfyUI workflow JSON or verify actual physical input connections. H3 hybrid is a LongMedia-specific route; FL2VA alone rejects additional actor/video references. Presence of FIRST/LAST in a reference manifest is not evidence that the target runtime follows them exactly. Demo placeholders are not attached assets. Other than the known documented mode routing, actual compatibility and quality remain NOT TESTED.

## Security

No media bytes, absolute file paths, API credentials, client assets or cloud sync. LocalStorage contains project metadata and instructions only; however text entered by the user may contain private material. Export JSON shares that text if distributed. Keep client materials out of public repositories. Storage can be cleared by the browser; export backups regularly.

## Test gates

`node --test src/*.test.mjs src/video-director/*.test.mjs`

The new tests cover synthetic shot structure, identity bindings, stable reference numbering, FL2VA incompatibilities, missing references, text stability, JSON transfer safety, architecture and camera contradictions. Existing Standard tests run unchanged.

Browser, offline PWA, fresh installation and physical ComfyUI generation remain NOT TESTED until an independently verified runtime session is available. Do not promote beyond BETA because CI passes.

## Retention and reusable layers

Each global or shot layer includes editable Retention Rules: reference ID, mode and attribute list. Conflicting modes on the same reference and overlapping attributes return `RETENTION_CONFLICT` and block export. Rules are explicit strings in the compiled prompt, not proof the target model can enforce them. `Layer Presets` are project-local snapshots: save a shot layer, apply independently to a chosen shot, or delete a preset. Existing Video Director v0.1 JSON with no `layer_presets` is accepted with an empty collection.

## Browser acceptance test

The CI job executes `node tools/test-video-director-browser.mjs` against an isolated local HTTP server using real headless Chromium. It tests tab switching, demo, retention UI, preset reuse, existing Standard localStorage keys, reload persistence, PWA precaching and offline boot. It fails if Chromium is unavailable rather than skipping checks. The test does not verify physical Android PWA installation or any MiniMax model.
