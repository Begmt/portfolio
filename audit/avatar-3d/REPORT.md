# Interactive 3D portrait

**Withdrawn after user review:** the procedural model did not preserve the accepted avatar's appearance. It has been removed from production and the exact previous portrait restored. [Current correction](../avatar-restore/REPORT.md). The implementation and measurements below describe historical release `84e6824`, not the current avatar. Its tests require that historical implementation.

## Character and layout

| Before | After |
|---|---|
| The About portrait was a flat generated WebP. | A real WebGL scene contains a stylized character made from three-dimensional meshes: face, hair, eyes, body, laptop, jointed arms, hands and headphones. The original image remains a loading and WebGL fallback poster. No real photograph or photo texture is included. |
| Portrait was 192 × 192 and its tour button covered the lower part. | A responsive square up to 256 × 256 leaves room for visible hand gestures. Controls and the tour invitation sit below the canvas. Wide layouts put experience and education beside the character; narrow layouts stack them. All space is reserved before loading. |

## Interaction

| Before | After |
|---|---|
| The character could only nod as an image. | Dragging rotates the actual scene through all angles; vertical tilt is limited. Arrow keys rotate/tilt, Home and Escape reset the view. |
| No independent arm movement. | Shoulder, elbow and wrist joints raise the right hand and wave. A visible “Помахать” button repeats the gesture. |
| Headphones were painted into the image. | On hover the headphone assembly moves from the head to the neck while both arms reach toward it. Leaving restores it; the “Наушники” button also controls this state on touch screens. The caption becomes “Слушаю вас”. |
| Touch interactions were limited to opening the guide. | Horizontal finger movement rotates the model; vertical swipes retain normal page scrolling. |
| Scroll-guide speech could cover the new portrait controls. | Its bubble yields while the 3D portrait is visible, and the companion hides during interaction with the portrait. The portrait caption introduces the About block; the walking guide resumes beyond it. |
| A focused calculator field suppressed guidance after scrolling away. | Editing suppression applies only while that field is visible. Scrolling to the next block resumes the guide without changing input or focus. |

## Loading, motion and fallback

| Before | After |
|---|---|
| There was no 3D runtime. | A local, pinned Three.js 0.187.0 ESM bundle loads only near the About section through dynamic import. The bundle is 571,555 bytes, approximately 145,345 bytes gzip; it is not requested on the first screen. No external runtime/CDN requests are added. |
| No scene lifecycle controls were needed. | On-demand rendering stops when idle, outside the viewport, in a modal or hidden tab. Gesture animation is capped at 30 fps and pixel ratio at 2. Reduced motion replaces animated transitions with static poses while retaining controls. |
| A WebGL failure could leave a blank interactive area. | Unsupported or lost WebGL retains/restores the original poster and disables the unavailable controls. |
| Published-source checking covered the original scripts. | It additionally verifies `avatar3d.js` and the local vendor bundle; these paths trigger the same strict Lighthouse gate. Per-run scores ≥90 and CLS <0.1 remain unchanged. |
| Reading `scrollY` during initial guide evaluation forced an early global layout. | The previous scroll position starts at zero and is read/updated only after actual scrolling; initial script evaluation no longer flushes layout for this value. |
| The portrait observer was prepared synchronously during initial script evaluation. | Its preparation starts on the first scroll or portrait interaction, with direct About links handled after DOM readiness. The same near-viewport import still presents the model when the visitor reaches it. |
| Git whitespace checks also interpreted upstream multiline shader strings as repository source. | `.gitattributes` exempts only the vendored Three.js bundle from whitespace checks, preserving its upstream GLSL text. Application source remains subject to the normal check. |

## Reproduction

Install only into the ignored QA runtime:

```powershell
npm install --prefix audit/avatar-guide/runtime --no-audit --no-fund --no-package-lock --save-exact three@0.187.0 esbuild@0.28.2
node audit/avatar-3d/build.cjs
```

The selected vendor exports are declared in `three-entry.js`; the built bundle and upstream MIT license are in `assets/vendor`. Reference: [official Three.js documentation](https://threejs.org/docs/).

## Validation

`verify.cjs` passed both themes at 320/390/769/1440 px: zero initial requests for the 3D module/vendor, actual rendered-pixel differences after rotation, keyboard/reset, arm gesture, headphones, hover, mouse drag, native CDP touch rotation versus vertical page scrolling, idle/offscreen rendering stop, forced WebGL fallback, zero JS/HTTP errors and zero axe violations. See `local-checks.json` and `local-*-portrait.png`.

The complete ten-step manual-guide suite passed in both themes at five widths. The scroll-following suite passed all ten blocks at six widths in both themes, including returning after scrolling past a focused ROI field. `verify-responsive.cjs` passed 18 theme/width combinations, the short viewport and five no-JS widths. Its profile geometry assertion now reflects the intended right-column experience layout on wide screens.

Gesture poses interpolate from their current values when interrupted. The tests wait for delivered native-popover state and the final rendered touch position rather than assuming synchronous browser events or image decode.

Syntax and whitespace checks passed. Published results follow deployment.

The first local Lighthouse attempt scored dark 55 and light 87, with CLS 0 and all other categories 100. All raw reports are retained under `lighthouse/local-3d-*`. Network requests confirm that neither the 3D module nor vendor bundle was loaded during performance measurement. The forced-reflow insight pointed to the initial `lastY=scrollY` assignment in `guide.js`; that eager read was removed. The dark run also recorded a 10-second unattributable long task. Follow-up measurements retain standard Mobile settings and new browser profiles.

Follow-up local attempts are also retained without selection: `local-3d-deferred-*` scored 48/88 and `local-3d-intent-*` scored 69/58 (dark/light Performance). Accessibility/Best Practices/SEO were 100 and CLS 0 in each. The 3D module/vendor are absent from their performance network records. These local runs did not confirm the target. The requested published-site result is evaluated separately below by the unchanged CI. No failing local report was removed or substituted.

## Published release

Application release: `84e68244aa4a01bd6810966624f66a5eb5d629ab`. GitHub Pages [42658874120](https://github.com/Begmt/portfolio/actions/runs/42658874120) succeeded. [The deployment manifest](../avatar-guide/walk-deployment.json) verifies all eleven production files, including the 3D module/vendor and three avatar images, against the release.

The full 3D suite passed again against the public URL: eight theme/width checks, actual rendered rotation, keyboard, wave, headphone controls, hover, drag, native touch rotation with retained vertical page scrolling, idle/offscreen stop and WebGL fallback. There were no JS/HTTP errors or WCAG A/AA axe violations. See `production-checks.json` and the visually inspected `production-*-portrait.png` screenshots. The full twelve-case scroll-follow suite also passed on the public site, including all ten blocks and guidance resuming after leaving a focused calculator field.

[Lighthouse Mobile CI 42658877226](https://github.com/Begmt/portfolio/actions/runs/42658877226) — **success**. Each of the ten cold profiles passed the original per-run gate; acceptance was not changed to a median.

| Metric | Dark | Light |
|---|---:|---:|
| Performance, all five samples | 90 / 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 / 100 |
| Accessibility, minimum | 100 | 100 |
| Best Practices, minimum | 100 | 100 |
| SEO, minimum | 100 | 100 |
| CLS, maximum | 0.0050224764 | 0.0050224764 |
| LCP, maximum | 1989 ms | 1720 ms |
| TBT, maximum | 390 ms | 41 ms |

Lighthouse 13.5.0 standard simulated Mobile, CPU ×4, RTT 150 ms, throughput 1638.4 Kbps. Actual themes were verified from Lighthouse JPEGs. The complete artifact, including all ten raw HTML/JSON/JPEG reports and source matching, is retained under `lighthouse/ci-42658877226/`. Each raw JSON was independently rechecked after download for the four ≥90 scores, CLS <0.1 and unchanged Mobile settings.

The final evidence-only commit is stored in `main`; `gh-pages` retains the verified application release. No application source changed after these published checks. Only portfolio was modified.
