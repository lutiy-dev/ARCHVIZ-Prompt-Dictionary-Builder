# ARCHVIZ · Prompt Studio

**Bilingual structured prompt composer for controlled AI-assisted architectural visualization.**

[Open Prompt Studio](https://lutiy-dev.github.io/ARCHVIZ-Prompt-Dictionary-Builder/)

ARCHVIZ Prompt Studio turns a technical dictionary into reusable prompt blocks, presets and a structured production prompt. It is designed for controlled image-to-image Archviz work where geometry, camera, proportions and design intent must remain explicit constraints.

**Status:** Experimental v0.1

## Production logic

```text
GOAL
→ SOURCE / INPUT
→ MUST PRESERVE
→ ALLOWED CHANGES
→ MATERIAL / SUBJECT
→ LIGHT / ATMOSPHERE
→ CAMERA / PHOTOGRAPHY
→ RESTRICTIONS
→ QC
```

The current version runs locally without a backend, API keys or cloud dependencies. Interface and explanations are bilingual-oriented; final production instructions are assembled in English.

## Features

- searchable EN/RU technical dictionary;
- reusable prompt blocks instead of repeated free-form text;
- Composer with deterministic section ordering;
- material, lighting and atmosphere presets;
- explicit conflict rules;
- local saved combinations;
- JSON import/export for transfer and backup;
- browser-only operation with no shared API key.

## Run locally

From the repository root:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

Opening `index.html` directly through `file://` is not supported because the application loads JSON data.

## Repository structure

```text
data/
  dictionary.json
  prompt_blocks.json
  presets.json
src/
  composer.mjs
  app.mjs
schemas/
docs/
design/
index.html
```

`data/prompt_blocks.json` is the source of truth for block text, parameters, section order, statuses and explicit conflicts. `src/composer.mjs` contains the reusable compilation logic.

## Verification

```bash
node --check src/app.mjs
node --test src/composer.test.mjs
```

**PASS:** syntax and tests succeed, references resolve, starter presets have no unresolved conflicts, and section ordering/deduplication remains valid.

Manual smoke test: add Facade → change scale → add Facade again → confirm the parameter is preserved → add Night → verify conflict handling → remove Overcast → save/reload → export/import the combination.

## Limitations

v0.1 does not semantically parse arbitrary pasted prompts and does not discover every possible contradiction. Conflicts are explicit rules in the data layer.

Starter blocks are currently **GENERATED**, not **TESTED** or **Production Standard**. Prompt text alone does not guarantee geometry preservation; production use still requires masks/structural control and comparison against the source render.

## Deployment

GitHub Pages is served from the repository:

https://lutiy-dev.github.io/ARCHVIZ-Prompt-Dictionary-Builder/

A successful source commit does not by itself prove deployment; the published Pages artifact should be checked after relevant changes.

## Stage 1 visual system

The accepted visual checkpoint is `85d90ba8a0b8c344229660e5be275c8bbf8b2a1f`.
Integration branch `integration/stage-1-main-sync` starts from main `9e5b579f7efd0ebd8e41262c7562bf7f421ab0dc` and carries over the static Process Map, SVG line icons and graphite/yellow workspace styling only.

The map explains REFERENCE → PRESERVE → MATERIAL → LIGHT → ATMOSPHERE → CAMERA → QC → STRUCTURED PROMPT. It does not control Library or Composer. The workspace remains 01 / DICTIONARY → 02 / ASSEMBLY → 03 / OUTPUT; category and preset controls remain native selects. Icons beside these labels identify the current selection.

All 55 main-library blocks, 10 presets, section order, explicit conflicts, generation logic and storage/import/export behavior remain unchanged. RU final-prompt preview, PWA installation and the Travertine preset from the earlier independent baseline branch are outside this visual-only integration. Existing EN/RU dictionary descriptions remain available.

Integration verification and merge conditions: [Stage 1 integration report](design/stage-1/INTEGRATION.md). Stage 1 was merged in `ec2e306833768b8f97dcda65566a60a1393a77b3` and verified on production Pages.


## Stage 2 — Object and Saved Prompts (review branch)

The Object / 3D Asset preset produces a structured image production prompt for a single prop, furniture item, lamp or architectural detail. It does not generate a 3D mesh. Seven object-specific blocks reuse four existing detail/light/cleanup blocks. The existing canonical section order stays unchanged: shape belongs to MUST PRESERVE, surface detail to MATERIAL / SUBJECT and background to RESTRICTIONS. All original 55 blocks and 10 presets remain intact; the review branch has 62 blocks and 11 presets.

**Saved Combination** stores a reusable recipe (blocks and custom parameters). **Saved Prompt** stores a particular finished English text and its effective parameter snapshot. Enter a prompt name beside Final Prompt and use Save Prompt after resolving conflicts. The full-width 04 / SAVED PROMPTS section provides Open / Load, Copy and Delete. Open / Load replaces the current assembly and displays the exact saved text; editing blocks or parameters resumes live composition. Copy on a saved card copies its frozen text.

Saved Prompts use a separate localStorage key, `archviz-prompt-library-v1`, with envelope `{schema_version:1,prompts:[...]}`. Each record contains `id`, `name`, `scenario` (preset ID), `text`, `blockIds`, `parameters` (effective values keyed by block ID) and ISO `createdAt`. Reads validate version, references, known parameters, field types, bounds and unique IDs. Corrupt or inaccessible storage shows a message; corrupt data is not overwritten. Quota errors leave the previous records intact. Existing combinations keep their `archviz-prompt-studio-v1` key and their original format and JSON import/export.

Saved Prompts are specific to the browser and site origin. Saved Prompts can be transferred through JSON Export / Import (see below); automatic cross-device synchronization is not provided. Scenario metadata uses the chosen preset; manually mixing presets still requires semantic review. The new blocks remain GENERATED and require validation against real reference images.

Stage 2 verification:

```bash
node --check src/app.mjs
node --check src/saved-prompts.mjs
node --test src/composer.test.mjs src/stage2.test.mjs
```

See [Stage 2 verification](design/stage-2/VERIFICATION.md) for test evidence and the browser verification limitation. Stage 2 is offered for manual review and is not merged into main.

## EN / RU preview and Video presets

Final Prompt offers EN Original / RU reading preview. Translations are derived from the actual English output using exact-source block templates, including frozen Saved Prompts. English remains the source of truth for Copy EN and Save Prompt. Unknown text and custom parameter values are retained as labelled [EN: …] fragments; this is a reading aid, not a general translation service. composer.mjs and storage schemas are unchanged.

Archviz Image-to-Video and Object Video add six shared/specialized GENERATED blocks and reuse existing architecture restrictions / object shape constraints. Defaults: 5 seconds, subtle forward dolly; change duration and movement in Composer. They produce prompt text only, no video API. Avoid motion revealing unsupported unseen surfaces. The library now has 68 blocks and 13 presets; all previous 62 blocks / 11 presets remain unchanged. These video prompts require real model testing; text constraints alone do not ensure temporal stability.

Checks: `node --test src/composer.test.mjs src/stage2.test.mjs src/translation-ru.test.mjs src/video.test.mjs`.

## PWA installation

Prompt Studio has its own manifest identity and project-relative scope, separate from Technical_Manual_UI. The header install action uses the native browser prompt when available and inline instructions otherwise. Installed mode opens in a standalone window. HTTPS (production Pages) or localhost is required.

The root Pages artifact includes manifest.webmanifest, sw.js, pwa-install-capture.js and 180/192/512/maskable PNG icons. The service worker uses a Prompt Studio-specific cache prefix, only caches the app shell, and attempts the network before cached fallback. It does not access localStorage or caches belonging to other applications. The first load must be online; offline use requires a successful shell cache.

Release verification must check the published artifact, browser registration and a fresh native installation. Static checks alone do not prove Android installation; verify that separately on a real device.

## License

Copyright (c) 2026 Oleg Gorkov.

ARCHVIZ Prompt Studio is licensed under the GNU General Public License, version 3 only (**SPDX: GPL-3.0-only**). See [LICENSE](LICENSE) for the complete, unmodified license text. No permission to apply later GPL versions is granted by this project notice.

Commercial use and sale are permitted. Distribution of covered modified versions must meet GPL-3.0 requirements, including providing Corresponding Source and preserving applicable notices.

This notice grants only rights the copyright holder is entitled to grant. It does not resolve the outstanding provenance review of inline SVG icons, the original visual showcase and legacy prompt texts, or replace any applicable third-party terms. No third-party runtime dependency was identified in the audit of application commit `9545918838b49abcf2e9e764fc673828259dc5bd`; this is not a legal guarantee of non-infringement.

The previously accepted application checkpoint `checkpoint/production-standard-v1.0.0` remains unchanged. This documentation update records the license choice without changing application code, data, UI or storage.

## Environment, night sources and people insertion

Environment / Context adds masked surroundings while preserving the primary architecture and source camera. Context Description accepts a custom environment brief; Perspective and Scale Match aligns horizon, vanishing directions and scale. Context Restrictions permits new neighboring context only inside the mask, unlike the existing global Negative / Exclusions. Do not combine those contradictory blocks.

Night / Existing Sources uses the existing Night block plus selective window illumination, visible street luminaires and headlights of existing vehicles. It does not create poles, cars or unsupported emitters. Source Lighting Match is intended for context matching, not day-to-night conversion.

Add People inserts new people into an insertion mask; the existing People preset still edits existing people. Count and activity are editable parameters. Perspective, scale, ground contact, shadows and anatomy need manual QC.

These additions bring the library to 81 blocks and 16 presets, preserving all previous 68 blocks and 13 presets. New prompt text is GENERATED; software validation does not establish image-model reliability. EN remains canonical, with exact-source RU reading aids. UI, composer logic and storage schemas are unchanged.

## Seasonal presets

Spring / Весна, Summer / Лето, Autumn / Осень and Winter / Зима reuse the existing seasonal blocks and preserve the source geometry and camera. They do not choose a time of day. Autumn includes editable fallen-leaf amount/distribution; Winter includes editable settled-snow amount/distribution. Both additions require a seasonal edit mask and keep entrances and circulation routes readable. Snowfall is not implied. Remove the optional Snow Cover or Autumn Fallen Leaves block for a season without ground decoration.

The library has 83 blocks and 20 presets. All previous blocks/presets remain unchanged. New prompt text remains GENERATED until tested with an image model; EN/RU software checks do not establish model-output accuracy.

## First → Last Frame video

First → Last Frame / Первый → последний кадр creates a structured video prompt between two supplied endpoint images. The images must show the same architecture with aligned framing, aspect ratio and camera. Duration and transition description are editable; the default is 5 seconds and a gradual lighting change. The camera stays locked. Architectural preservation and temporal QC reuse existing blocks; four endpoint-specific blocks are added. Existing Image-to-Video and Object Video presets remain unchanged.

The library now has 87 blocks and 21 presets. This preset produces text only: attach both images to a video workflow/model that supports first/last-frame conditioning. It does not upload images, call an API or guarantee exact endpoint matching. New prompt text is GENERATED; software validation is separate from real video-model testing. EN is canonical with an exact-source RU reading aid.

## Saved Prompts transfer

Use Export on a saved card for one record, or Export All · JSON for the library. Import · JSON validates the entire file before adding records. Existing prompts and combinations are preserved; identical record IDs/content are skipped on repeat import. A matching ID with different content rejects the entire import rather than overwriting it. Unknown block/preset references, invalid schema or records, files over 10 MB and libraries over 500 records are rejected. Storage errors leave the previous data intact. Transfer uses the existing `{schema_version:1,prompts:[...]}` envelope and `archviz-prompt-library-v1` key. JSON includes the frozen English final text and block/parameter snapshot. This is manual file transfer, not account synchronization. Custom private text in the file is shared when you send it.
