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

Saved Prompts are specific to the browser and site origin. This first version has no Saved Prompt export/import or cross-device synchronization. Scenario metadata uses the chosen preset; manually mixing presets still requires semantic review. The new blocks remain GENERATED and require validation against real reference images.

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
