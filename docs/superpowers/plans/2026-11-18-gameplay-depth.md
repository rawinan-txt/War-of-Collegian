# Gameplay Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Synergy, Ultimate Meter and a 3-phase boss to the single Stage 1 battle, then rebalance.

**Architecture:** `index.html` stays one file with global functions and a global `battle` object. A Node harness (`tests/harness.js`) loads the inline `<script>` into a `vm` context with stubbed DOM/canvas so game logic (`startBattle`, `update`, `deploy`, ...) runs headless and can be asserted. New content is data tables (`SYNERGIES`, `ULTIMATES`) plus small functions.

**Tech Stack:** Vanilla JS + Canvas, Node (built-in `node:test`, `node:vm`, `node:assert`), no dependencies.

**Spec:** `docs/superpowers/specs/2026-11-18-gameplay-depth-design.md`

## Global Constraints

- Keep everything in `index.html` (single file, GitHub Pages demo must keep working); no new runtime dependencies.
- Player faculty (`faculty` variable) must never change combat stats or restrict heroes; synergy reads only hero `f` values.
- Synergy and boss attacks must be visible (team screen list, HUD notice, telegraph marks).
- Ultimates: Wi-Fi Down stun all enemies 3s; Salaya Rain enemy speed -40% for 8s; Campus Shuttle damage + knockback. Pick 1 before battle.
- Boss: Phase 2 at HP < 50% (Exam Paper Rain, telegraphed ~1s); Phase 3 at HP < 20% (Overtime: attack speed +100%, damage +30%).
- Spec deviation (decided): the roster has one hero per faculty, so "3 same-faculty heroes" is impossible. Synergies are group-based instead: Tech Alliance (ICT + EG: +10% damage for those two heroes), Healthcare Network (>=3 heroes from SI, RA, DT, PY, NS, MT, PT, TM, PH: heal +12%), Campus Life (>=2 heroes from MUSIC, SC2, MUIC, SH, LA, CMMU: cooldown -8%).

## Review Focus

- Team with zero synergies: no modifiers, no crash, team screen shows "ไม่มี Synergy".
- Ultimate pressed with empty meter, while paused, or after battle ended: no effect.
- Ultimate with zero enemies on field: meter still consumed only if triggered; must not throw (Shuttle with empty `enemies`).
- Boss killed in one big hit from >50% HP (Base Skill / Shuttle): phases must not re-trigger or throw; Rain telegraphs pending when boss dies must not damage allies afterwards.
- Restarting a battle (`startBattle`) mid-ultimate/mid-telegraph: no state leaks from the previous `battle`.

---

### Task 1: Headless test harness

**Files:**
- Create: `tests/harness.js`
- Create: `tests/harness.test.js`

**Interfaces:**
- Produces: `loadGame(): { run(code: string): any, ctx: vm.Context }` — evaluates `index.html`'s inline script once in a fresh context (DOM/canvas/`requestAnimationFrame`/`performance` stubbed; `frame` never runs) and `run` evaluates code in that same context so top-level `let`/functions (`battle`, `team`, `startBattle`, `update`) are reachable. Also `tick(game, seconds, step=0.05)` helper that calls `update(step)` repeatedly.

- [ ] **Step 1: Write the failing test** `tests/harness.test.js` (`node:test`): `loads game and starts a battle` — `const g = loadGame(); g.run('startBattle()'); assert.equal(g.run('battle.baseHp'), 5000)`; `deploy spends AT` — after `g.run("deploy('bug')")`, `battle.at` < 180 and `battle.units.length === 1`.
- [ ] **Step 2: Run** `node --test tests/` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement `loadGame` in `tests/harness.js`**: read `index.html`, extract the text between `<script>` and `</script>`, run via `vm.runInContext` with stubs: `document.getElementById` returns an object whose `classList.toggle/add/contains`, `getContext` (returns a Proxy whose properties are no-op functions and accept assignment), `style`, `textContent`, `innerHTML` are inert; `requestAnimationFrame = () => 0`; `performance.now`.
- [ ] **Step 4: Run** `node --test tests/` — Expected: PASS.
- [ ] **Step 5: Commit** `test: add headless game harness`

### Task 2: Faculty Synergy

**Files:**
- Modify: `index.html` (after `heroes` table: `SYNERGIES` + `calcSynergies`; `startBattle`, `renderTeam`, `makeUnit`/`update` where cooldown, heal and damage are applied)
- Test: `tests/synergy.test.js`

**Interfaces:**
- Consumes: `heroes`, `team`, `battle.cd`, hero fields `id`, `f`, `type`, `cd`.
- Produces: `SYNERGIES: Array<{id, name, desc, active(ids: string[]): boolean, fx: {cdMul?: number, healMul?: number, dmgMul?: number, dmgHeroFaculties?: string[]}}>` and `calcSynergies(ids: string[]): SynergyResult[]` (the active entries) and `battle.syn: {cdMul: number, healMul: number, dmgFor(heroId): number}` set in `startBattle`.

- [ ] **Step 1: Write failing tests** in `tests/synergy.test.js`: `calcSynergies(['bug','mecha',...])` includes `tech_alliance`; `['bug','lab',...]` (no EG) does not; team `['night','chem','nurse','public','bug','lab']` includes `healthcare` (4 heroes) and with only 2 healthcare heroes does not; `['music','runner',...]` includes `campus_life`; a team of `['lab','mecha','animal','dental','bug','music']`-style with no groups returns `[]`. Battle effects: with Healthcare active, a heal of base 185 heals 207 (round) (assert `a.hp` delta); with Campus Life active `battle.cd` after deploy equals `h.cd * 0.92`; with Tech Alliance a `bug` hit deals `39 * 1.1` (compare `damageDone` over first shot) while a `lab` hit is unchanged. Changing `faculty` between 'ICT' and 'MT' leaves all of these identical.
- [ ] **Step 2: Run** `node --test tests/synergy.test.js` — Expected: FAIL (`calcSynergies` not defined).
- [ ] **Step 3: Implement** the table with the values in Global Constraints and `calcSynergies`; in `startBattle` compute `battle.syn`; apply `cdMul` where `deploy` sets `b.cd[id]`, `healMul` where heals apply, `dmgMul` (only for heroes whose faculty is in `dmgHeroFaculties`) where `damage(target,val,...)` value is computed for allies.
- [ ] **Step 4: UI** `renderTeam` shows active synergies (name + desc) under the grid, or "ไม่มี Synergy"; battle HUD shows them in `battleInfo`.
- [ ] **Step 5: Run** `node --test tests/` — Expected: PASS.
- [ ] **Step 6: Commit** `feat: faculty synergy system`

### Task 3: Ultimate Meter

**Files:**
- Modify: `index.html` (`ULTIMATES` table, `ultType` selection UI on team screen, `startBattle` state, `useUltimate`, meter gain in `damage`, effects in `update`, HUD button + meter, draw for shuttle/stun)
- Test: `tests/ultimate.test.js`

**Interfaces:**
- Consumes: `battle`, `damage(u, amt, sourceId)`, `battle.enemies`.
- Produces: `ULTIMATES: {wifi:{name,desc}, rain:{...}, shuttle:{...}}`; global `ultType: 'wifi'|'rain'|'shuttle'` (default `'wifi'`); `battle.ult` (0–100); `useUltimate(): boolean` (true if fired); enemy field `stun` (seconds; stunned enemies skip move/attack and still take damage); `battle.rain` (seconds remaining); `battle.shuttle: {x:number, hit:Set}|null`.

- [ ] **Step 1: Write failing tests**: meter starts 0; `useUltimate()` at 0 returns false and changes nothing; gain: damaging an enemy for 400 adds 20 (dmg/20), a kill adds 8, an ally taking 300 adds 10 (dmg/30), capped at 100; at 100, `ultType='wifi'` → every enemy `stun === 3`, meter resets to 0, stunned enemy `x` unchanged after 1s of `tick`; `rain` → after firing, enemy displacement over 1s with `rain` active is <= 0.6 × baseline (use two identical battles); `shuttle` → enemies in its path take damage once each and end at larger x (knockback); `useUltimate()` returns false when `battle.paused` or `battle.ended`; Shuttle with `enemies = []` does not throw.
- [ ] **Step 2: Run** `node --test tests/ultimate.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** gain inside `damage()` (use the existing `actual` and `sourceId`/`u.ally` branches; kills add 8) and the effects. Shuttle: starts at x=80, moves 700 px/s, damages each enemy once (400) when passing and pushes it +120, ends past x=1025. Rain: speed factor 0.6 for enemies while `battle.rain>0`, 8s.
- [ ] **Step 4: UI** team screen radio list for `ultType` with desc; battle HUD ultimate button (disabled until 100) with meter bar; draw stun icon on stunned enemies and the shuttle sprite (emoji 🚌 scaled) on canvas.
- [ ] **Step 5: Run** `node --test tests/` — Expected: PASS.
- [ ] **Step 6: Commit** `feat: ultimate meter with three ultimates`

### Task 4: 3-phase boss

**Files:**
- Modify: `index.html` (`spawnEnemy` boss template fields, boss phase logic in `update`, telegraph drawing, notices)
- Test: `tests/boss.test.js`

**Interfaces:**
- Consumes: `spawnEnemy('boss')`, `damage`, `battle.units`.
- Produces: boss unit fields `phase: 1|2|3`, `rainTimer`; `battle.warnings: Array<{x:number, t:number}>` (telegraph marks, `t` seconds until impact; impact damages allies within 60 px of `x` for 160).

- [ ] **Step 1: Write failing tests**: boss spawns with `phase === 1`; setting boss `hp = maxHp*0.49` then `tick` makes `phase === 2` and `warnings.length > 0` within 3s of ticking; an ally standing at a warning x takes 160 only after `t` reaches 0 (not before); setting `hp = maxHp*0.19` gives `phase === 3` with `atk` = 150×1.3 (195) and `interval` = 1.8/2 (0.9), and phase-3 stats are applied exactly once over 10s of ticks; dropping boss from 100% to 10% HP in one `damage` call ends in phase 3 with a single Overtime application; killing the boss with pending warnings leaves allies' HP unchanged afterwards (warnings cleared).
- [ ] **Step 2: Run** `node --test tests/boss.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** phase transitions checked each `update` for boss units (HP ratio < .5 → phase 2 if phase < 2; < .2 → phase 3 applying ×1.3 atk and ×0.5 interval once); Rain every 6s places 3 warnings at random ally-side x positions with `t = 1`; notices "⚠ EXAM PAPER RAIN" / "🔥 OVERTIME!"; clear `warnings` when boss dies and in `startBattle`.
- [ ] **Step 4: Draw** warnings as red pulsing circles on the road, and tint the boss red in phase 3.
- [ ] **Step 5: Run** `node --test tests/` — Expected: PASS.
- [ ] **Step 6: Commit** `feat: three-phase final exam boss`

### Task 5: Balance pass

**Files:**
- Create: `tests/balance.sim.js` (script, not a unit test: prints a table)
- Modify: `index.html` (numeric constants only)

**Interfaces:**
- Consumes: `loadGame`, `tick`, `deploy`, `useUltimate`, `upgradeIncome`.
- Produces: `simulate(teamIds: string[], ultType: string): {win: boolean, time: number}` with a simple deterministic bot (deploy any affordable ready card in team order, upgrade income when AT >= upgrade cost and level < 4, fire ultimate when ready).

- [ ] **Step 1: Write `simulate` and a table of 6 teams** (mixed-faculty team A, all-tank, all-ranged, healthcare-heavy, campus-life, random) × 3 ultimates; run with a seeded `Math.random` override for reproducibility.
- [ ] **Step 2: Run** `node tests/balance.sim.js` and record results.
- [ ] **Step 3: Tune constants** (ultimate gain divisors, damage/cost numbers, synergy values only if needed) until: mixed-faculty teams win in most runs, no single hero appears in all winning teams, all-ranged and all-tank teams are viable but not strictly better than mixed, stage length stays under the 300s cap.
- [ ] **Step 4: Run** `node --test tests/` — Expected: PASS (re-run all unit tests after tuning; update exact-number assertions only if a constant intentionally changed).
- [ ] **Step 5: Commit** `balance: tune stage 1 after synergy and ultimate`
