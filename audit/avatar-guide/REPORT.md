# Portfolio guide

## Character and placement

| Before | After |
|---|---|
| About card used the initials БИ. | Generated transparent 3D avatar, based on the supplied cartoon and facial reference; the real photo is not included. |
| No invitation to explore the site. | Hero invitation and an About action open a short guided route. |
| Only standard navigation accompanied scrolling. | Desktop launcher remains in the lower left; mobile uses a 48 px avatar button in the header. |
| No image assets for a guide. | Two alpha-preserving WebP assets: 4,084 bytes for small launchers and 20,700 bytes for the lazy profile/panel image. Full generated source and prompt remain in excluded QA files. |

## Interaction and motion

| Before | After |
|---|---|
| Visitors selected sections unaided. | Six manually advanced steps: welcome, cases, GitHub projects, workflow, About, contact. Reopening from the persistent launcher starts near the current section. |
| No step context. | Step count, progress track, Back/Next controls and a temporary section-heading outline. Section heights are resolved before anchor navigation. |
| No companion motion. | A single 700 ms nod on opening and a 180 ms panel entrance. Transform/opacity only; reduced motion cancels and disables these animations. |
| No preference for hiding the character. | Close/Escape/light dismiss collapse the panel; “Скрыть проводника” remembers the preference locally. Explicit invitation buttons can reopen it. |
| No guide keyboard behavior. | Native nonmodal popover, named dialog, polite step status, 40–48 px controls, focus on Close at entry, return to opener, final focus on Telegram without opening or sending a message. |
| Guide could conflict with existing overlays. | Opening a modal closes the guide; mobile menu and guide close each other. Main content remains available during the nonmodal tour. |
| A JavaScript-only feature could leave dead controls. | Without JavaScript only the About avatar remains. A manual popover fallback supports older browsers. |

## Publication verification

| Before | After |
|---|---|
| Lighthouse deployment matching covered the original scripts. | It also verifies `guide.js`; guide source and assets trigger the same strict Mobile CI. Every measured run still requires all four scores ≥90 and CLS <0.1. |
| Local Lighthouse installation existed only in an expired npm cache. | Pinned Lighthouse 13.5.0 is installed into an ignored QA runtime directory; dependencies are not committed or published. |

The `audit` directory remains excluded from the Pages package by `_config.yml`.

## Local validation

- `verify.cjs`: both themes × 320/390/768/769/1440 px; full six-step route, context on reopen, Back, focus, Escape, native light dismiss, hidden preference persistence, menu/modal coexistence, no overflow. Four open-panel axe scans: zero WCAG A/AA violations. Reduced-motion change cancels the nod, fallback popover works, no-JS retains only the profile avatar. See `local-checks.json` and screenshots.
- `audit/lighthouse-final/verify-responsive.cjs`: all 18 theme/width combinations, 390 × 500 viewport and five no-JS widths passed; cases, profile, keyboard/menu, wizard, real clipboard, stubbed email draft, all HTTP/JS errors and axe violations checked.
- Standard Lighthouse 13.5.0 Mobile, separate cold profiles: dark **91/100/100/100**, LCP 2556 ms, TBT 252 ms, CLS **0**; light **90/100/100/100**, LCP 2557 ms, TBT 283 ms, CLS **0**. Raw JSON/HTML/JPEG in `lighthouse/local-guide-*`.
- `node --check` and `git diff --check` passed. No original photographic portrait is stored or referenced by production code. All changes are scoped to portfolio.

Published checks follow after deployment; local measurements do not substitute for the requested published Mobile results.
