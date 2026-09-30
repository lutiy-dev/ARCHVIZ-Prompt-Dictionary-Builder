# Stage 1 Integration / Main Sync

Status: READY FOR INTEGRATION (source and automated checks); browser rendering/smoke not verified in this environment. No merge into main performed. Stage 2 not started.

## Immutable recovery point and integration base

- Accepted Stage 1: `85d90ba8a0b8c344229660e5be275c8bbf8b2a1f`.
- Recovery branch: `checkpoint/stage-1-accepted-2026-09-30`, unchanged.
- Stage 1 original last known good baseline: `7ac959ed0d85a1505475d2e2489dd897b22f464c` (tree identical to local `9bd13f6`).
- Actual main at integration start: `9e5b579f7efd0ebd8e41262c7562bf7f421ab0dc`.
- Integration branch: `integration/stage-1-main-sync`, created directly from that main.

## Provenance of expanded main

These branches diverged at `68aeedd903142605e35ddd213c2f698eea213c2d`; main did not descend from the Stage 1 baseline. Differences are not proof that main deleted previously merged features.

Main added three commits after the common ancestor:

1. `89f8e64`: 35 new blocks; expanded explicit mutual time-of-day conflicts on Overcast Day and Night. Original 20 block texts and canonical section order retained.
2. `84d31a4`: 35 matching dictionary entries (20 → 55).
3. `9e5b579`: updated repository README, production logic, features, local run, verification, limitations and Pages documentation.

Main has **55 blocks, 55 dictionary entries and 10 unchanged presets**. The former naive full-branch merge had **56** because it also pulled in the independent baseline Travertine block. Main alone never had 56 at the inspected SHA.

Retained byte-for-byte from main: all data JSON, composer, composer tests, schema/audit files, generation/conflict logic and storage/import/export/copy handlers. Main's 35 new blocks, parameters and conflict rules are fully preserved. README retained in full with a relevant Stage 1 appendix, rather than selecting one side of the old conflict wholesale.

## Test root cause, individually

The earlier result was **9 passing, 1 failing**, not 9 failing. Reproduced against the temporary full-branch merge tree `aeba55d94ad2be114710b296a78ac5fe22a17587`:

| Test | Earlier combined tree | Reason |
|---|---|---|
| References and parameters resolve | PASS | All block/preset/dictionary IDs and placeholders resolve. |
| Canonical order | PASS | Section ordering retained. |
| Merge preserves parameters and deduplicates | PASS | Existing custom parameters retained. |
| Substitution and duplicate removal | PASS | Templates and exact deduplication correct. |
| Conflicts / safe presets | PASS | Explicit warnings and presets consistent. |
| Unknown blocks fail | PASS | Expected exception produced. |
| Travertine masked scope | PASS | Present in the naive combined tree. |
| Travertine material conflicts | PASS | Alternate material warnings present. |
| Exact RU source coverage | FAIL | 21 translation entries vs 56 combined blocks; the test's count assertion fails before per-block checks. Independent inspection confirms the 35 added main IDs have no translation mapping in the baseline. |
| Custom EN parameter in RU | PASS | Custom value retained with EN marker. |

Current main has only the first six tests and no `translation-ru.mjs` or RU final-output mode. This integration keeps those tests unchanged. It does not import unrelated baseline composer/RU/PWA/Travertine capabilities. Therefore **no RU translations are required for the visual-only integration** and none were added. The existing dictionary `ru` fields are short descriptions, not full prompt translations. Restoring RU final-output would be a separately approved integration scope, not an implicit Stage 1 change; it would require the missing 35 translations listed below. No coverage tests were weakened or removed: main's test file is byte-identical.

## Stage 1 carried over

- `index.html`: static ordered Process Map, SVG symbol sprite, decorative headings/field icons, original main controls and IDs retained.
- `src/style.css`: graphite/yellow visual system, cards, hierarchy, spacing and responsive map (8/4/2 columns). No dependencies.
- `src/app.mjs`: SVG rendering and current category/preset label decoration only; no generation/state/storage changes.
- `README.md`: Stage 1 documentation appendix only.
- `design/stage-1/INTEGRATION.md`: this report.

## Verification

Main before edits and integration after edits: `node --check src/app.mjs` PASS; `node --test src/composer.test.mjs` **6/6 PASS**. `git diff --check` PASS.

Temporary jsdom workflow on actual main and integration: category/search → block → preset → parameter → repeated preset → conflict/copy rejection → remove conflict → final prompt → copy EN → save/clear/load → export/clear/import. Output, stored JSON and exported JSON matched exactly. Clipboard/download are mocks; real browser operations and reload persistence remain unverified.

SVG references and all existing preset icon mappings resolve. Process Map has eight stages and no controls/handlers. Browser smoke/screenshots remain unavailable due local Chrome socket restrictions and cloud localhost blocking observed during Stage 1; no visual PASS is claimed for this integrated result.

Before merge: review this narrower diff, confirm main has not moved, run browser smoke/responsive checks on the integrated branch, then explicitly authorize merge. If main changes, recheck integration and tests. Stop on test failure, data loss, changed behavior or unresolved conflicts. Keep the accepted checkpoint branch unchanged.

## Missing full-prompt RU mappings (only for separately approved RU-view restoration)

These are existing main block IDs and Russian titles, not newly proposed full translations. Full translations are not necessary for the requested integration and have not been authored or applied.

- `golden-hour` — Золотой час
- `blue-hour` — Синий час
- `early-morning` — Раннее утро
- `bright-midday` — Яркий полдень
- `late-afternoon` — Поздний день
- `twilight` — Сумерки
- `soft-diffused-light` — Мягкий рассеянный свет
- `hard-sunlight` — Жёсткий солнечный свет
- `side-light` — Боковой свет
- `backlight` — Контровой свет
- `warm-interior-glow` — Тёплый свет из интерьеров
- `clear-air` — Чистый воздух
- `light-haze` — Лёгкая дымка
- `light-mist` — Лёгкий туман
- `after-rain` — После дождя
- `dramatic-clouds` — Выразительные облака
- `subtle-aerial-perspective` — Воздушная перспектива
- `microdetail` — Микродетали материалов
- `roughness-variation` — Вариативность шероховатости
- `subtle-weathering` — Деликатное старение
- `edge-wear` — Естественный износ кромок
- `stone-detail` — Детализация натурального камня
- `concrete-detail` — Архитектурный бетон
- `glass-realism` — Реалистичное стекло
- `pavement-detail` — Микродетали покрытия
- `natural-greenery-detail` — Детализация зелени
- `spring` — Весенняя атмосфера
- `summer` — Летняя атмосфера
- `winter` — Зимняя атмосфера
- `highlight-rolloff` — Мягкий rolloff светов
- `natural-contrast` — Естественный контраст
- `neutral-color` — Нейтральный цветовой баланс
- `premium-real-estate` — Премиальная подача недвижимости
- `editorial-architecture` — Редакционная архитектурная подача
- `final-cleanup` — Финальная очистка
