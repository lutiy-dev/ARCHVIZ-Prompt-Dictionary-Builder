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

Integration verification and merge conditions: [Stage 1 integration report](design/stage-1/INTEGRATION.md). Stage 2 is not started.
