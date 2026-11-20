# War of Collegian — Auto Play

An optional mode that plays the player's decisions during a battle. It is a **player-input automation layer, not a buff**: it only calls the three actions a human uses (`deploy`, `upgradeIncome`, `baseSkill`), so every rule (AT, cost, cooldown, 35-unit cap, laser cooldown, pause, speed) is enforced by the same code as manual play. Nothing about stats, costs, skills, enemies, spawns, the laser, RNG or formulas was changed.

## Using it
- **Auto: ปิด / เปิด** button in the battle HUD (top right, next to Pause). Gold-blue = Manual, **green = Auto on**. Click any time; the battle is not restarted or altered by the toggle.
- While Auto is on, two compact chips appear: **เลเซอร์** (Auto Base Laser) and **อัป AT** (Auto AT Upgrade). Both default to on; dim = off.
- Manual actions keep working while Auto is on (cards, upgrade, laser, ultimate, pause, 1×/2×).
- Every new battle starts in **Manual**. After Victory or Defeat Auto stops deciding. A short "AUTO" floater marks each automatic deployment; upgrades and laser use the game's normal notices.
- The **Ultimate stays manual** (not part of this milestone).

## How it decides
`autoDecide()` runs every **0.25 s of simulation time** (`AUTO.interval`) from `update()`, before the units act:
- never while paused (the update loop returns first), identical at 1× and 2×, independent of frame rate (the accumulator is clamped, at most 2 decisions per update, no backlog);
- at most **one deployment or upgrade per decision**; the laser may fire in the same decision;
- **no random numbers** (a test checks that the evaluation does not move either RNG stream); it only reads battle state, so the same seed and inputs replay identically.

State it observes (`autoState`): AT, income, level, upgrade cost, cooldowns, own and enemy units, enemy distance to the player base (threat < 260 px, danger < 160 px), frontline health, injured allies, enemy clustering, big enemies, boss present, ranged enemies, healers out, the team's hero types, stage boss time.

Priorities, in order:
1. **Laser** (if the option is on and the laser is ready): fire when it hits something worth it — an enemy at the base (danger, ≥ 300 damage of value), a threat with ≥ 2 shots of value, a group worth ≥ 3 shots, or ≥ 2 kills. Never with no valid enemies. Uses the existing `baseSkill()` (identical for every faculty).
2. **AT upgrade** (if on): only with ≥ 2 units out, no threat, enough AT, and only if the upgrade pays back within ~70 % of the expected remaining battle (`bossAt + 75 s − t`); while enemies approach it keeps ≥ 120 AT for defenders. Max level and cost are the manual ones.
3. **Deployment**: score every ready hero of the selected six (`autoScore`): stars; frontliners (tank, shield, pierce, dash) when the frontline is thinner than the enemy count needs; damage dealers (ranged, aoe, poison, slow, pierce, summon) with bonuses for clusters, big enemies, bosses, ranged enemies; healers only when allies are hurt (or one is missing with a populated field); a penalty for repeating the same hero; in a threat, cheap and sturdy units are preferred. Pick the best **affordable** one.
4. **Saving AT**: if a clearly better ready hero is within ~25 s of income, wait for it — but not while enemies are within 420 px, when AT is almost full, or with fewer than 2 units out. **Variety guard**: after four deployments of the same hero in a row it waits up to 8 s for a different one.

It works from `team` and `STAGES`, so future stages and teams need no changes.

## Statistics
Auto-deployed units go through `deploy()` and are counted by `CombatStats` exactly like manual ones; DMG / DEF / HEAL are unchanged and nothing is attributed to Auto.

## Tests
`tests/autoplay.test.js` (19 tests): toggle mid-battle keeps state; resets to Manual per battle; HUD states; Auto off = no state added and identical battles; deploy through the normal action and cost; insufficient AT; cooldown gaps; unit cap; manual actions while Auto is on; upgrades (cost, options, level cap, threat, late battle, fewer than 2 units); laser (worth-it rules, cooldown, option, identical for every faculty); no decisions while paused; fixed 0.25 s interval at any frame size and 2×, bounded per update, one deployment per tick; no random draws; whole battles on both stages with four team compositions using only the selected six, ending cleanly; mix is not one hero; healer and frontline logic; saving; identical replay (Full/Reduced/Off, drawn or not, 2×); DMG/DEF/HEAL; manual replay unchanged.
Browser pass (`56/56`): HUD at 1280×720, 1366×768, 1920×1080 (no overlap, no page scroll, targets ≥ 36 px), click on/off, deploys by itself, pause, 2×, option chips, laser, off mid-battle, result ends decisions, new battle resets.
Auto **off** compared with the previous build: combat traces identical (3 teams × 3 seeds, with and without drawing, 18/18).

## How good is it? (tools/sim-balance.js, 8 teams × 8 seeds per stage, policy `auto`)
| Stage | Auto win rate | Scripted "spam the fewest" policy |
|---|---:|---:|
| 1 | 41–45 % | 69 % |
| 2 | 94 % | 59 % |
Read this carefully:
- Stage 2 is easy for Auto because it uses things a human can use (income upgrades, laser timing, AT saving) that the crude scripted policy never does. That is skill, not extra power — but it means Stage 2's 54 % tuning was measured against a weak player.
- Stage 1 is lower than the scripted policy: Stage 1 is dominated by spamming the cheapest ranged unit (see `docs/BACKLOG.md`), which Auto deliberately does not do, and Auto does not use the Ultimate, which the scripted policy does.
- Expensive-only teams (e.g. lab, chem, music, dental, night, public) and tank-heavy teams struggle in Stage 1 with Auto as they do without it; Auto may deploy mostly one hero there.

## Known limitations
- One fixed rule set; it does not learn, and it does not use the Ultimate.
- It cannot dodge area attacks (nor can a human; see backlog).
- The AT-saving rule trades tempo for quality; in Stage 1 tempo often wins, so Auto is not optimal there.
- Option choices (laser / upgrade) are per session, not saved between sessions.
