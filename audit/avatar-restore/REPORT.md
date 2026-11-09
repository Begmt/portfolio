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
