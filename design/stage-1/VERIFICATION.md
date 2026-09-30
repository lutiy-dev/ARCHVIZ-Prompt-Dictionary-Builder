# Stage 1 / UI Visual System

Status: IMPLEMENTED / BROWSER ACCEPTANCE PENDING. Stage 1 is not PASS yet.

## Baseline

- Local commit: `9bd13f6caafe7b1782bc031725ea08e656bb8af9`.
- Corresponding published commit: `7ac959ed0d85a1505475d2e2489dd897b22f464c`.
- Identical baseline tree: `1e0ab08086f3126a08def927cfd410bc9c37971e`.
- Local baseline tag: `baseline/stage-1-2026-09-30`.
- Implementation branch: `feat/stage-1-ui-visual-system`.
- No repo-local AGENTS.md found. README and HTML/CSS/app/composer/data/tests inspected.
- Visual reference: `lutiy-dev/lutiy-dev/assets/prompt-studio-constructor-preview.png`.

## Changes

- `index.html`: static eight-step Process Map, inline SVG symbol set, decorative heading/field icons. Map is an ordered list with no controls or application event handlers.
- `src/style.css`: graphite cards, restrained yellow accents, compact hero, consistent line icons, spacing and active language-tab states. Process Map wraps to four columns below 1100px and two below 700px. Existing workspace remains three stages.
- `src/app.mjs`: decorative icons for existing category/block headings and selected preset/category labels. Native select controls, values, data and all existing actions retained.

## Verified

Before and after:

- `node --check src/app.mjs`: PASS.
- `node --test src/composer.test.mjs`: 10/10 PASS.
- `git diff --check`: PASS.
- No changes to `data/*.json`, composer, translation, tests, manifest, service worker, storage key/format, generation, conflict, save/load, import/export or copy handlers.
- Temporary jsdom regression scenario executed on baseline and updated version: search/category, add block, preset, custom parameter, repeated preset preserving parameter, conflict blocking copy, remove conflict, EN/RU, copy EN, save/clear/load, export/import. EN prompt, saved storage JSON and exported JSON matched exactly.
- All rendered SVG references resolve; all 11 preset icon mappings resolve; map has eight steps and no controls.

The jsdom check uses mocked clipboard and download APIs. It does not verify browser rendering, actual clipboard/download, page reload persistence or responsive layout.

## Required browser acceptance

Still pending: desktop and mobile visual review, actual Copy EN, reload/load, downloaded JSON round trip and screenshots. Full required sequence:

Library → Search/Category → Add Block → Preset → Parameters → Conflict → Final Prompt → Copy EN → Save Combination → Reload/Load → Export JSON → Import JSON.

Local browser launch blocked by `socket() failed: Operation not permitted`; cloud browser blocked localhost with `ERR_BLOCKED_BY_CLIENT`. No real screenshot produced; no full browser smoke PASS claimed.

## Limits

Icons beside native select labels represent the currently selected category/scenario; native option lists retain text. No dependency/framework added to the application. Installed PWA update and offline behavior need target-browser verification; service worker behavior unchanged. Published baseline remains on its existing branch. Stage 2 not started.
