# ARCHVIZ Prompt Studio — Production Standard v1.0.0

Accepted by Oleg on 2026-10-01 (Europe/Moscow).

## Frozen application checkpoint

- Application commit: `9545918838b49abcf2e9e764fc673828259dc5bd`.
- Recovery branch: `checkpoint/production-standard-v1.0.0` (do not advance this branch).
- Previous recovery point before PWA restoration: `536ad1ce15f79ef246d76f772a3da6ede1df9db5`.
- Published URL: https://lutiy-dev.github.io/ARCHVIZ-Prompt-Dictionary-Builder/

The user designates this exact build as the working Production Standard. This designation does not turn generated prompt blocks into validated model output.

## Accepted baseline

68 blocks / 13 presets, static Process Map, graphite/yellow visual system, viewport-height desktop workspace, internal Library/Composer scrolling, footer Saved Prompts, Object and Video presets, English final text and derived Russian reading preview. Existing combinations, Saved Prompts and JSON import/export retain their established formats. PWA has a separate project-relative identity/scope, launcher icons and isolated cache prefix.

## Verification evidence

- Existing tests: 17 PASS, 0 FAIL.
- App, service worker and install script syntax: PASS.
- DOM smoke: search/categories, preset, parameters, conflict handling, final prompt, EN copy, saved combination, export/import, Saved Prompt save/reload/open/copy/delete and corrupt storage behavior PASS.
- Manifest identity/scope and icon dimensions: PASS.
- Emulated early native install capture and installed UI: PASS.
- Emulated service-worker scope and cache cleanup isolation from Technical_Manual_UI: PASS.
- GitHub Pages build/deploy run 36829639289: PASS.
- Published index, manifest, service worker, install capture and all four icons match checked source bytes: PASS.
- Production browser: install button and 68-block library observed.

## Explicit remaining limitations

Fresh installation on the user's desktop and Android device has not been confirmed. Standalone launch and real offline behavior require device acceptance; these are not represented as TESTED. Generated Object/Video prompts still require real image/video model testing and architectural QC. Local browser storage is not cross-device sync or a backup; export combinations before browser data removal.

## Change rule

Further development starts from this checkpoint on a new branch. Preserve the checkpoint; do not force-update it. Do not modify model/data/defaults, storage, generation or UI outside the user's explicit scope. Run relevant syntax/tests and workflow checks before accepting the next build. Keep failures and untested capabilities distinct from PASS evidence.

## Restore locally

```bash
git fetch origin
git switch --detach 9545918838b49abcf2e9e764fc673828259dc5bd
python -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/. Avoid switching with unsaved work; retain the current work separately first.
