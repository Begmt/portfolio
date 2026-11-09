# Restore the original avatar

The user rejected the procedural 3D replacement because it changed the character's appearance. Restoring the accepted portrait takes priority. No new avatar was generated or substituted.

| Before | After |
|---|---|
| A procedural 3D character replaced the accepted portrait. | The exact `assets/guide/avatar-384.webp` from release `392c614` is displayed again. Its bytes and SHA-256 are unchanged. |
| Rotation, arm and headphone controls belonged to the rejected character. | The 3D canvas, controls and interaction captions are removed. This release displays the original two-dimensional portrait and does not claim full 3D interaction. |
| A runtime module and Three.js vendor bundle could load near About. | The loader, model and vendor bundle are removed from production, along with their shader-whitespace exception. Existing reports remain as historical evidence. |
| Wide profile layout was changed around the larger 3D scene. | The pre-3D portrait/card layout is restored. |
| Scroll guidance yielded to the procedural portrait. | Automatic explanations cover About again; the ten-block walking guide and input-focus fix are retained. |
| Deployment matching included removed runtime files. | It checks the surviving production files; the original per-run Lighthouse ≥90 and CLS <0.1 thresholds remain intact. |

An exact rotatable and articulated 3D version of the accepted character is not delivered by this rollback. The available source is a raster portrait; a matching 3D model has not been provided or produced. Reintroducing another approximate character would repeat the same mistake.

Local validation passed in both themes at 320/390/769/1440 px. The portrait SHA-256 matches release `392c614` exactly: `e5a74f5de6ea7f3442dbebe0b78560b88fba5546c241b6979a85b3bc0df226ec`. There are no rejected-model or vendor requests, rotation/gesture controls, unsupported 3D captions, JS/HTTP errors, overflow or axe violations. The About guide invitation works. See `local-checks.json` and screenshots.

The full scroll-following regression passed all twelve theme/width combinations and all ten blocks. Syntax and whitespace checks passed. Publication verification follows deployment.

## Published verification

Release `04dc24c0449fc2ddb61c27c8b3a4f61de429f323` is serving on the public site. [The manifest](../avatar-guide/walk-deployment.json) matches all nine runtime files and images. The public restoration suite passed all eight theme/width checks, with the same original image hash, no model/vendor requests, no unsupported 3D controls/captions, no overflow, no JS/HTTP errors and no axe violations. See `production-checks.json` and the visually inspected `production-*` screenshots.

GitHub Pages run `42673195821` reports an overall failure, although its build job `129350283216` and deploy job `129350433677` both report success. The reason for that status discrepancy was not determined. Actual publication is independently confirmed by the nine content hashes and the browser checks; the code was not changed or republished merely to alter that status.

[Published Lighthouse Mobile 42673198951](https://github.com/Begmt/portfolio/actions/runs/42673198951) completed **success**. All ten cold profiles meet the unchanged original per-run thresholds:

| Metric | Dark | Light |
|---|---:|---:|
| Performance, five samples | 99 / 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 / 100 |
| Accessibility, Best Practices, SEO minima | 100 / 100 / 100 | 100 / 100 / 100 |
| CLS maximum | 0.0050224764 | 0.0050224764 |

All raw HTML/JSON/JPEG reports are retained under `lighthouse/ci-42673198951/` and were independently rechecked for scores, CLS, actual theme and standard Mobile settings (Lighthouse 13.5.0, CPU ×4, RTT 150 ms, throughput 1638.4 Kbps). No threshold was weakened.

The final evidence-only commit goes to main. The verified application remains on gh-pages at `04dc24c`; no application code changes follow these checks. Only portfolio was changed.
