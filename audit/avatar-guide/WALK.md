# Scroll-following avatar

Appearance correction: the user rejected the later procedural 3D portrait; [the exact previous avatar has been restored](../avatar-restore/REPORT.md). The ten-block scroll guide remains active. References to the 3D release below are historical.

## Context and movement

| Before | After |
|---|---|
| Guide required manual Next/Back navigation through six sections. | Automatic explanations cover all ten visible sections: hero, cases, GitHub, approach, integration map, before/after, ROI, workflow, About, contact. The detailed manual route also covers all ten. |
| Launcher stayed in the lower-left corner. | After the first scroll it becomes a full-body character. Its position follows progress through each block, alternating travel direction at the boundaries. The figure turns with the direction of travel and bobs while scrolling, stopping after 180 ms without movement. |
| Desktop and mobile movement used no scroll context. | Desktop travel is bounded to the viewport and rises near the right edge above the contact CTA; on mobile horizontal movement is limited to 24 px. |
| Initial walking trajectory could overlap the floating CTA at intermediate desktop widths. | Its reserved space is calculated from the CTA dimensions, with an early vertical rise. The figure clears the button before their horizontal ranges intersect. |
| Avatar image was a waist-up portrait. | Built-in imagegen extends the same character into a transparent full-body walking pose. The 8,436-byte WebP is loaded only after scrolling starts; the original portrait remains in the header and profile. No real photograph is included. |

## Explanation and control

| Before | After |
|---|---|
| Descriptions appeared only in the manual popover. | A compact speech bubble automatically names the current block and explains its purpose or relevant interaction. “О блоке” opens that block in the detailed guide. |
| Accompaniment did not respond to visitor tasks. | It hides while editing a visible field, using a modal or mobile menu, viewing the detailed guide, or while the document is hidden. It resumes afterward and when scrolling past a focused field, without moving focus or changing the entered value. |
| Hide preference applied to the old launcher. | The same saved preference suppresses automatic accompaniment. The close control and Escape hide it; explicit invitations can restore it. Automatic updates do not move focus or create live announcements. |
| Character motion was limited to an entry nod. | Movement uses transform, scale and a short walking sway. Reduced motion fixes the character position and disables travel/sway while retaining automatic explanations. Source geometry reads are batched in one requestAnimationFrame per scroll frame and only inspect outer sections. No continuous JavaScript animation loop is introduced. |

## Validation

`verify-follow.cjs` covers all ten blocks in both themes at 320/390/768/769/1440/1920 px, unique contextual explanations, viewport bounds, focus preservation, editing suppression, manual-guide handoff, modal handling, remembered dismissal, reopening, no overflow and axe. A separate normal-motion case checks actual position change, walking while scrolling, stopping after scroll and dynamic reduced-motion changes. `verify.cjs` now checks the ten-step manual route.

Local results:

- `verify-follow.cjs`: 12 theme/width combinations × all ten blocks, four axe scans, zero JS/HTTP errors, zero overflow and zero violations. Actual normal-motion travel, stopping after scroll and dynamic reduced-motion behavior passed.
- Updated `verify.cjs`: all ten manual-route checks, five widths per theme, keyboard, native light dismiss, menu/modal interactions, hidden preference, fallback and no-JS passed.
- `audit/lighthouse-final/verify-responsive.cjs`: all 18 theme/width combinations, short viewport and five no-JS widths passed, including cases, ROI, wizard, clipboard, email drafts and axe.
- Standard local Lighthouse 13.5.0 Mobile in separate cold profiles: dark **90/100/100/100**, LCP 2555 ms, TBT 287 ms, CLS **0**; light **92/100/100/100**, LCP 2553 ms, TBT 225 ms, CLS **0**. Raw reports in `walk-lighthouse/local-walk-*`.
- Syntax and whitespace checks passed. Only portfolio files were changed.
- Additional normal-motion CTA regression: the first path overlapped the button at three of twenty tested positions (all at 769 px). After using the reserved button area, `verify-cta-clearance.cjs` passes all twenty positions at 769/1024/1440/1920 px. Before and after geometry is retained in `local-cta-clearance.before.json` and `local-cta-clearance.json`. The complete twelve-case follow suite passed again, including turning toward the direction of movement. The published audit below covers this final trajectory adjustment.

The existing strict published Lighthouse Mobile gate remains unchanged: each of ten cold runs needs all four scores ≥90 and CLS <0.1.

## Published completion

Final application release `84e68244aa4a01bd6810966624f66a5eb5d629ab` also includes the [interactive 3D portrait](../avatar-3d/REPORT.md). All twelve public follow checks passed: both themes × six widths, ten block contexts, scroll-driven travel, turning, stopping, reduced motion, dismissal/reopen, viewport bounds, fields and modal coexistence, zero JS/HTTP errors and zero axe violations. `production-follow-checks.json` retains the results; `walk-deployment.json` matches all eleven runtime files to the release.

The published [Lighthouse CI 42658877226](https://github.com/Begmt/portfolio/actions/runs/42658877226) passed all ten cold profiles with the original per-run thresholds: dark Performance **90/100/100/100/100**, light **100/100/100/100/100**, all other categories **100**, CLS max **0.0050224764** in both themes. Full raw reports are in `../avatar-3d/lighthouse/ci-42658877226/`.

The walking asset was created with built-in imagegen; [final prompt and asset paths](WALK-PROMPT.md). No real photo was published. QA evidence is committed to main; the verified application release remains on gh-pages.
