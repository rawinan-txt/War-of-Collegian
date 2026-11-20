# War of Collegian — Enemy System

Nine enemies, two stages, two boss encounters. Art and animation are generated from code (`tools/enemies/`), gameplay stats and abilities
are data in `index.html`. Nothing about player characters, AT, the faculty laser or combat randomness was changed.

## The roster

| ID | Name | Role | Stage | HP | ATK | Range | Speed | Interval | Notes |
|---|---|---|---|---:|---:|---:|---:|---:|---|
| assignment | Assignment Monster | basic | 1, 2 | 420 | 52 | 40 | 38 | 1.4 | unchanged |
| deadline | Deadline Monster | fast | 1, 2 | 300 | 65 | 38 | 67 | 1.1 | unchanged |
| group | Group Project Gang | tank | 1 | 1350 | 58 | 42 | 25 | 1.6 | unchanged (160 shield, as every tank) |
| quiz | Midterm Exam | ranged | 1 | 450 | 75 | 125 | 32 | 1.8 | unchanged |
| final | Final Exam | boss | 1 | 6400 | 150 | 58 | 20 | 1.8 | unchanged: paper rain below 50%, overtime below 20% |
| professor | Strict Professor | ranged | 2 | 440 | 62 | 150 | 30 | 2.3 | red pen projectile; outranges most heroes |
| ta | Ruthless TA | fast support | 2 | 270 | 31 | 95 | 62 | 1.5 | fragile; buffs nearby enemies |
| advisor | Thesis Advisor | elite control | 2 | 1300 | 50 | 140 | 22 | 2.6 | purple projectile; every 3rd hit weakens the target |
| exammaster | Exam Master | boss | 2 | 5800 | 97 | 150 | 21 | 2.2 | dark exam energy; telegraphed area attacks, 3 phases |

New enemy stats live in `enemyTemplates()` (index.html). They were tuned with `tools/sim-balance.js` (see Balance).

### Abilities (all deterministic, no random draws)
- **Ruthless TA** — first cast after 3 s, then every 9 s, only when another enemy is within 150 px: those enemies get **+25 % move speed and +20 % attack speed for 4 s**. The cast plays the skill animation and the TA stops for 0.4 s. A green arrow marks buffed enemies.
- **Thesis Advisor** — every **third** attack carries *Overdue*: the target deals **-25 % damage for 3 s**. It cannot be refreshed while active and the target is immune for 6 s after it is applied, so there is no permanent control. A purple arrow marks weakened heroes.
- **Strict Professor** — plain ranged attack (projectile launched on the impact frame, damage on arrival).
- **Exam Master** — every 10 s (phase 1), 8 s (below 60 % HP), 7 s (below 25 % HP) it casts a **warning**: 1, 2 or 3 purple rings (radius 70) appear on the floor at the front-most heroes and **land 1.5 s later for 115 damage**. Rings are kept apart, nobody is hit outside a ring, and two overlapping rings still cannot kill the weakest hero (360 HP). The boss stops for 0.7 s while casting. Below 25 % it also hits 20 % harder.

## Stages
`STAGES` in `index.html` is data: name, description, roster (sprites are loaded for it only), spawn pick, spawn gap, boss type and time, an optional second boss (`bossType2`, `bossAt2`) and an optional enemy `scale` (`{hp, atk}`, applied to every enemy and boss of that stage). The stage is chosen on its own screen after the team builder (faculty → team → stage → battle).

| Stage | Name | Roster | Boss | Scale | Scripted-policy win rate |
|---|---|---|---|---|---:|
| 1 | Midterm Rush | Assignment, Deadline, Group, Midterm | Final Exam @85 s | none (original, bit for bit) | 71 % |
| 2 | Faculty Staff | Assignment, Deadline, Professor, TA, Advisor | Exam Master @90 s | none | 54 % |
| 3 | Group Project Hell | Assignment, Deadline, Group, Midterm, TA | Final Exam @95 s | hp x1.08, atk x1.03 | 75 % |
| 4 | Thesis Defense | Deadline, Group, Midterm, Professor, TA, Advisor | Exam Master @100 s | hp x1.08, atk x1.02 | 36 % |
| 5 | Exam Week | all seven regular enemies | **Final Exam @90 s, then Exam Master @150 s** | hp x1.05 | 28 % |

Stage 5 has two bosses on their own timers; the stage counts as "boss dead" (so the base takes full damage) only when no boss is alive and none is still to come. Single-boss stages behave exactly as before.
Win rates are from `tools/sim-balance.js` (8 teams x 8 seeds, the scripted "spam the fewest" policy); targets were about 50-80 % for standard stages and 30-60 % for boss stages. Stage 3 is the easiest for that policy but the hardest for Auto Play (22 %, Final Exam with a scaled roster); Auto gets 77 % on stage 4 and 44 % on stage 5. Tank-heavy teams lose in every stage, as noted in the backlog.
`tests/stages.test.js` checks stage data, spawn picks, scaling, the two bosses, loading, and that every stage can be played by hand and by Auto and ends in the right result.

## Animation
Every enemy has `idle` (4 f @ 6), `walk` (6 @ 12), `attack` (6 @ 12, impact on frame 3), `hurt` (3 @ 12), `death` (6 @ 10). `final`, `ta`, `advisor`, `exammaster` also have `skill` (10 @ 14, impact on frame 6). Bosses die in 8 frames (0.8 s) and their corpse stays long enough to show it.
Timing equals the combat timers (`ATK_DUR` 0.5, `IMPACT_DELAY` 0.25, `HURT_DUR` 0.25, `SKILL_DUR` 0.72), so projectiles leave on the impact frame.

How the frames are made (`tools/enemies/rig.js`): the approved static drawing is built on a `RigBuf`; everything before `mark()` is the body, everything after is detached bits (sparks, floating sheets, aura). The body is split by rectangles into **parts** (head, arms, held prop, torso, legs). A **pose** moves the parts, leans or squashes the figure, tints it (ordered dither, no new colours), fades it (dither) and adds bits. The outline (dark inner + white outer, like the heroes) is drawn **after** posing. The all-zero pose reproduces the approved static art exactly; `tests/enemies.test.js` checks that frame 0 of every idle sheet equals `assets/enemies/<id>/static.png` byte for byte.

Boss display scale is visual only: `final` 3.3x (2 x the old 1.65), `exammaster` 3.0x. The HP bar sits above each sprite's own height (`barY`). A test plays the same battle at two very different scales and requires identical results.

## Files
```
assets/enemies/<id>/{static,idle,walk,attack,hurt,death[,skill]}.png   64x64 frames side by side
assets/enemies/enemies.js          generated ENEMY_ANIMS registry: timing, impact, anchors, scale, shadow, HP-bar height, fx colour + projectile style
tools/enemies/art.js               the approved static drawings (do not redraw: approved art is the standard)
tools/enemies/rigs.js              per-enemy parts + pose recipes
tools/enemies/rig.js               part splitter / pose compositor
tools/gen-enemies.js               node tools/gen-enemies.js  -> sheets + registry (deterministic)
tools/gen-enemy-preview.js         docs/enemy-remodel/preview.html (live animations, metrics)
tools/sim-balance.js               deterministic balance simulation
index.html                         enemyTemplates, ENEMY_KITS, STAGES (gameplay data) and the small hooks
```
Gameplay stats are **not** duplicated in the registry: art/timing in `enemies.js`, stats/abilities in `index.html`, joined by the enemy `id`.

## Adding an enemy
1. Draw the static sprite in `tools/enemies/art.js` (64x64, `RigBuf`, `b.mark()` where the outline would go, detached bits after it). Save it as the approved standard: copy the first idle frame to `assets/enemies/<id>/static.png`.
2. Add an entry to `RIGS` in `tools/enemies/rigs.js`: part rectangles, leg rectangle, a `recipe(anim, f)` returning poses, `anchors.muzzle` (world px, positive = forward), optional `drawOpts` for animated bits. Add the id to `ANIMS` (give it `skill` only if it has an ability).
3. Add metadata (name, role, `fx` colour, `proj` projectile style, optional `scale`) to `META` in `tools/gen-enemies.js` and the id to `IDS` in `tests/enemies.test.js`.
4. `node tools/gen-enemies.js`, then `node tools/gen-enemy-preview.js` and look at `docs/enemy-remodel/preview.html`.
5. Add the stats to `enemyTemplates()` in `index.html` (`kit:'name'` if it has an ability) and the id to a stage's `enemies` list and `pick`. An ability goes in `ENEMY_KITS` + `enemyKit()`; keep it free of random draws.
6. Run `node --test tests/*.test.js` and `node tools/sim-balance.js 2 --seeds 12`.
Rules that keep combat honest: no new `crand()` / `vrand()` call sites (a test counts them), visual effects only through `burst`/`fxBurst`, nothing in a simulation function may read sprite data.

## Balance (tools/sim-balance.js, 8 fixed teams x 12 seeds per stage)
| Stage | Win rate | Boss reached / killed | Avg battle | Notes |
|---|---:|---|---:|---|
| 1 (unchanged) | 71 % | 100 % / 85 % | 161 s | boss stage as before |
| 2 | **54 %** | 100 % / 88 % | 199 s | target for a boss stage: 30-60 % |

Stage 2 by team: mixed 67, support 33, tanky 67, low-star 67, ranged-heavy 33, tank-heavy 0, support-heavy 100, balanced 67 (%). Raw summary: `docs/enemy-remodel/balance-summary.json`.
Findings:
- No stage-2 enemy makes it unwinnable: seven of eight teams win, the boss is killed in nearly every run.
- **Tank-heavy (mecha, public, dental, runner, night, lab) loses 100 % in both stages, including the untouched Stage 1.** It is a hero-composition weakness that exists without the new enemies (it has almost no cheap ranged damage); it was not changed because player stats are out of scope. A simple "deploy cheapest first" policy gave the same result.
- **One cheap unit alone**: Bug Hunter alone wins 8/8 of Stage 1 (a pre-existing trait: the cheapest unit can be spammed up to the 35-unit cap, and ranged units stack their damage bonus) and 3/8 of Stage 2. Mecha alone wins 0/8 in both. A deployment cap per hero would fix the Stage 1 case but changes player rules, so it is proposed, not applied.
- The simulator is one fixed policy, not a skilled player: treat the numbers as a baseline.

## Tests
`tests/enemies.test.js` (27 tests): sheets and registry, frame-0 identity with the approved art, real frame differences, death collapse, palette and ground row, generated files up to date, timing vs combat timers and impact frames, projectile on the impact frame, stage tables (Stage 1 bit for bit), unchanged stats of the five old enemies, fair stats of the new ones, lazy loading per stage, TA buff, buff multipliers, Advisor weaken + immunity + 75 % damage, Exam Master warning / zone / damage / no one-shot, phases and cooldowns, Final Exam unchanged, boss scale is visual only, death handling, Full/Reduced/Off identical, 2x speed and pause identical, AT economy, DMG/DEF/HEAL, victory and defeat, performance, stage picker.

## Known limitations
- Frames are generated by posing the approved drawings (part moves, squash, lean, dither), not hand-drawn cell by cell; limbs do not bend, so arms move as rigid blocks. Fine at 2x game scale; look at `docs/enemy-remodel/preview.html` for the real thing.
- No separate Spawn or Phase-transition sheets for the bosses; phase changes are shown by the cast pose, notices and the warning rings.
- Heroes cannot dodge or move out of a warning ring (the game is auto-battle); the ring is a readable cue and a limit on damage, not a dodge mechanic.
- Stage selection is a two-tile picker; the result screen and stats are shared by both stages.
