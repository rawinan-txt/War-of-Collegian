# War of Collegian — UI Design System v3 "Premium Cartoon Mobile Game UI + Mahidol identity"

All UI styling is in `public/assets/ui/ui.css` (loaded after the inline `<style>` in `index.html`, so it restyles by cascade).
The redesign is **presentation only**: ids, JS functions, stats, AT costs, skills, combat RNG, Base Laser and balance are unchanged
(verified by deterministic combat traces against the pre-redesign `index.html`).

## Direction
- Cartoon mobile-game feel (think LINE Rangers): raised buttons, rounded frames, collectible character cards, bright status colours.
- Identity: navy + gold as the base. Blue = secondary, green = ready/confirm, purple = Ultimate/enemy, red = exit/danger.
- No neon glow, no CRT. The **battlefield is the loudest thing on screen**; HUD chrome stays calm navy.
- Signature: a faculty-colour tab/ribbon wherever a faculty is named (card ribbon, slot top bar, base plaque, faculty list).

## Tokens (`:root`)
| Group | Tokens |
|---|---|
| Navy ramp | `--ink #081032`, `--navy-950 … --navy-500` |
| Gold | `--gold-300/400/500/700`, `--gold-ink` (text on gold) |
| Status | `--blue-*`, `--green-*`, `--purple-*`, `--red-*` (500 = button end colour, white text ≥ 4.6:1) |
| Text | `--chalk`, `--chalk-2`, `--chalk-3` (≥ 4.7:1 on every panel surface) |
| Spacing | `--s-1..6` = 4 / 8 / 12 / 16 / 24 / 32 |
| Radius | `--r-sm 10`, `--r-md 14`, `--r-lg 20` |
| Type | `--display` Mitr (headings, buttons, numbers), `--font` Kanit (body); scale 12 / 13 / 15 / 17 / 22 |
| Motion | `--ease`, press 90ms, fast 140ms, med 220ms, enter 320ms |

## Fonts (offline, licensed)
Mitr + Kanit (Thai + Latin), SIL OFL 1.1, stored in `public/assets/fonts/` with license texts and `README.md`. Thai + Latin subsets only
(8 woff2 files, ≈ 140 KB). Only two files are preloaded. No request leaves the machine (verified in the browser).
Press Start 2P is not used (no Thai glyphs).

## Components
| Component | Class | Notes |
|---|---|---|
| Button | `button` (gold primary), `.secondary` (blue), `.green`, `.purple`, `.danger` | raised key; press sinks 4px in 90ms; hover brightens; disabled desaturates; 3px gold focus ring |
| Meters | `.meter` (AT), `.hpbar` (+`.low` pulses) | glossy rounded tracks |
| Character card | `.ccard` + `.r1…r5`, `--fc` faculty colour | frame colour = star rarity (5★ gold→pink→purple foil), gold coin = AT cost, ribbon = name, stars, faculty · role; selected = gold ring + green check |
| Deploy card | `.unitbtn` + `.r1…r5` | same frame; cooldown = dark sweep + seconds; `lack` state when AT is short |
| Team slot | `.tslot` | click or Enter removes the hero |
| Filter chip | `.fchip` (+`.on`) | `aria-pressed` |
| Panel | `.panel`, `.b-base`, `.b-center`, `.b-left`, `.stats-panel` | navy gradient, ink outline, light inner rim, hard bottom lip |
| Page transition | `#curtain.go` | navy curtain with a gold edge wipes across on every screen change (visual only, `show()` stays synchronous) |

## Team Builder (ready for 100 characters)
Rail (search, faculty, stars, role, sort, clear) | collection grid | detail strip | team dock (6 slots, Synergy, Ultimate, Start pinned at the bottom).
- Pure function `filterHeroes(list, state)` (tested): search over name, skill, description and faculty code (Thai ok); faculty / role filters toggle; star filter is multi-select; sorts: default, star, AT cost, faculty.
- State (`TB`) survives team edits and screen changes; empty state offers "ล้างตัวกรอง".
- Performance: sprite portraits are `<img loading="lazy">` crops of the real idle frame; cards use `content-visibility:auto`; the grid scrolls inside itself (no page scroll).
- Short screens (≤ 800px high): compact dock so the 6 slots, Synergy and all 3 Ultimates are visible **above** the pinned Start button.

## Battle
Top bar (base HP · wave/synergy · enemy HP · pause / speed / VFX / exit) → canvas with collapsible DMG/DEF/HEAL drawer on the right → dock (AT + upgrade / laser / ultimate, then 6 deploy cards).
Fits 1920×1080, 1366×768 and 1280×720 without page scroll; the drawer never covers the dock.

## Accessibility and motion (UI/UX Pro Max checks)
Contrast ≥ 4.5:1 for text on every surface and button end colour (computed, 45 pairs); body text ≥ 12px; visible focus; targets ≥ 36px in the HUD;
`prefers-reduced-motion` removes the curtain and collapses animations; state is never colour-only (check badge, text, ring).

## Rules for future UI work
1. Tokens only; spacing on the 4px grid.
2. Gold = primary action and selection. One gold primary per screen.
3. No emoji, exclamation marks, glow or hue washes in UI text/CSS (emoji left in `index.html` are canvas game art and fallbacks).
4. Keep ids used by JS and tests (`card-*`, `cd-*`, `cdf-*`, `sval-*`, `sbar-*`, `srow-*`, `statsList`, `resultStats`, `fxBtn`, `teamGrid`, `teamSlots`, `ultPick`, `startBtn` …).
5. The test harness stubs elements: new JS may only use `getElementById` + `classList.*`, `style.<property>`, `textContent`, `innerHTML`, `disabled`, `value`.
6. Never touch combat/VFX code in UI work; verify with `tests/lib/combat-trace.js` against the previous `index.html`.

The static mockups in `docs/ui-v2/` were the proposal; the shipped game (this document) supersedes them.
