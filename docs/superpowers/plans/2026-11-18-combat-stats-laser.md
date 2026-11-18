# Combat Statistics + Faculty Laser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old damage tracker with an authoritative CombatStats (DMG/DEF/HEAL) shown in a right-side collapsible panel, and replace Base Skill with one universal Faculty Laser.

**Architecture:** `index.html` stays one file. A `CombatStats` object (`recordDamage/recordDefense/recordHealing/getAllCharacterStats/resetBattleStats`) is the only stats source; combat code calls it at the point where HP/shield/heal actually change. Laser constants live in `FACULTY_LASER`; cosmetics in `FACULTY_LASER_VFX`. Tests extend the Node harness (`tests/harness.js`).

**Tech Stack:** Vanilla JS + Canvas; Node `node:test` + `vm`.

**Spec:** `docs/superpowers/specs/2026-11-18-combat-stats-laser-design.md`

## Global Constraints

- Single `index.html`; keep the 12 heroes, AT economy, chibi art, unique skills, ultimates/synergies/boss from the previous branch.
- DMG = actual HP damage only (no overkill, not shield damage). DEF = damage actually absorbed by shields, credited to the shield provider. HEAL = effective healing only (no overheal).
- Faculty Laser: damage 500, cooldown 45s, knockback 0, stun 0, slow 0, hits 1, every enemy in the lane once, no damage to enemy base; identical for all faculties; faculty config is cosmetic only (default VFX fallback).
- Panel: right side, edge toggle button, tabs DMG (red/orange) / DEF (blue) / HEAL (green), update ~200 ms, sorted desc, faculty + value + bar, drawer on small screens, final stats kept on result screen, reset on new battle.

## Review Focus

- Shield absorbs more than incoming damage / zero damage: no negative or double counts.
- Healing a full-HP target and overheal: records only the missing HP.
- Dog dies / summoner dies before the dog hits: damage still credited to the summoner.
- Shield provider unit dies or shield expires unused: no DEF credit; later damage not credited to a dead provider's old shield twice.
- Retry/new battle: stats start at zero; result screen still shows final stats; pause does not change stats; tab switch does not touch battle state.

---

### Task 1: CombatStats core + damage attribution

**Files:**
- Modify: `index.html` (`CombatStats` definition, `startBattle` reset, `damage()`, `makeUnit` owner field, dog creation in summon branch, base-skill damage separation)
- Test: `tests/combatstats.test.js`

**Interfaces:**
- Produces: global `CombatStats` with `recordDamage(sourceId: string, amount: number): void`, `recordDefense(sourceId, amount): void`, `recordHealing(sourceId, amount): void`, `getCharacterStats(id): {characterId, characterName, facultyId, totalDamage, totalDefense, totalHealing, deploymentCount}`, `getAllCharacterStats(): CharacterCombatStats[]` (one per hero in `team`, even with zeros), `resetBattleStats(): void`, `recordDeploy(id)`; `ownerOf(sourceId: string): string` (maps `'dog'` summons to their summoner id; unit field `owner`); `CombatStats.laserDamage: number`.
- Consumes: `team`, `heroes`, `damage(u, amt, sourceId)`.

- [ ] **Step 1: Write failing tests** (`combatstats.test.js`): normal hit credits `totalDamage` = actual HP lost; overkill (enemy hp 100, hit 500) records exactly 100; hit absorbed entirely by shield records 0 damage; AoE (`lab`) credits splash damage to `lab`; poison ticks credit the poisoner (`chem`) and keep crediting after the poisoner dies; a dog summoned by `animal` deals damage credited to `animal` (not `dog`), including when `animal` has died; `deploy` increments `deploymentCount`; `resetBattleStats`/`startBattle` zero everything; base-skill/laser damage is not in any hero's `totalDamage`.
- [ ] **Step 2: Run** `node --test tests/combatstats.test.js` — Expected: FAIL (`CombatStats` not defined).
- [ ] **Step 3: Implement**: `CombatStats` keeps a map id→record built in `resetBattleStats()` from `team`; unknown ids ignored. In `damage()` replace the old `damageDone/damageBase/damageTaken` bookkeeping with `CombatStats.recordDamage(ownerOf(sourceId), actualHpLoss)` for enemy targets (skip `'__base__'`/`'__laser__'`/`'__ult__'`/`'boss'`, which go to `laserDamage`/nothing). Dog units get `owner:'animal'` in `makeUnit`; `ownerOf` reads the unit table first, falling back to the id itself. Damage dealt to the enemy base by units (`b.damageBase`) is not counted in DMG (spec: HP damage of units only) — keep a separate `CombatStats.baseDamage[id]`.
- [ ] **Step 4: Run** `node --test tests/` — Expected: PASS (update older tests that read `battle.damageDone`, e.g. synergy/boss tests, to read `CombatStats.getCharacterStats(id).totalDamage`).
- [ ] **Step 5: Commit** `feat: CombatStats damage tracking with owner attribution`

### Task 2: DEF (shield providers) and effective HEAL

**Files:**
- Modify: `index.html` (`makeUnit` shield init, shield regen in `shield` hero branch, `damage()` shield absorption, heal branch in `update`)
- Test: `tests/combatstats.test.js` (append)

**Interfaces:**
- Consumes: `CombatStats.recordDefense/recordHealing` (Task 1).
- Produces: unit field `shieldSrc: {[providerId]: number}` whose values sum to `u.shield`; helper `addShield(u, providerId, amount, cap)`.

- [ ] **Step 1: Write failing tests**: shield 200 vs 300 incoming → DEF +200 for the provider, 100 HP damage, DMG credited only 100; a self-barrier (`mecha`, initial 160) credits `mecha`; `public` zone shield on an ally credits `public`, not the ally; two providers on one unit: absorbed damage split by what each actually absorbed, total DEF == shield lost (no double count); shield that is never hit records 0 DEF; incoming 0 damage records nothing; healing a full-HP ally records 0; healing 100 missing with 185 heal records exactly 100; `massheal` credits each target's effective amount; Healthcare Network multiplier still applies before the cap.
- [ ] **Step 2: Run** `node --test tests/combatstats.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** `addShield` and consume providers in insertion order inside `damage()` (record DEF per provider for the amount each absorbed; keep `u.shield` equal to the sum). Heal: `eff=Math.min(hv, a.maxHp-a.hp)`; `recordHealing(ownerOf(u.id), eff)`; floater shows `eff`.
- [ ] **Step 4: Run** `node --test tests/` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: DEF from shield absorption and effective healing stats`

### Task 3: Universal Faculty Laser

**Files:**
- Modify: `index.html` (`baseSkill`, `FACULTY_LASER`, `FACULTY_LASER_VFX`, Base Skill button/labels/notice, `renderFaculty` preview text, draw of beam)
- Test: `tests/laser.test.js`

**Interfaces:**
- Produces: `FACULTY_LASER` (constants from Global Constraints), `FACULTY_LASER_VFX: {[facultyId]: {color, particleStyle}}` + `laserVfx(facultyId)` (returns default for unknown), `baseSkill(): boolean` (fires the laser; false when on cooldown/paused/ended); `battle.laser: {t, color, particleStyle}|null` for drawing.
- Consumes: `faculty`, `faculties`, `damage(u, amt, '__laser__')`.

- [ ] **Step 1: Write failing tests**: for every faculty id in `faculties` (22) set `faculty=id`, start battle, add 3 enemies (hp 1000), `baseSkill()` → each enemy loses exactly 500, total enemy x unchanged (no knockback), no stun/slow fields set, cooldown == 45 for all; second `baseSkill()` immediately returns false and deals nothing; enemies hit once even if `update` runs many frames during the beam animation; enemy base HP unchanged; unknown faculty id uses default VFX; `FACULTY_LASER_VFX` entries contain only `color`/`particleStyle`; laser damage lands in `CombatStats.laserDamage`, not in any hero's DMG; ultimate meter not charged by the laser.
- [ ] **Step 2: Run** `node --test tests/laser.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** one shared `baseSkill` using `FACULTY_LASER`; remove per-faculty combat text ("500 Damage · Knockback"); button label "✨ Faculty Laser"; draw a beam from the player base across the lane for ~0.5s using the faculty colour with decorative particles by `particleStyle` (digital/sparks/molecules/heartbeat/notes/nature/default); give ICT, EG, SC, SI/RA (medical), MUSIC, VS custom entries, everything else falls back to default via the faculty's existing accent colour.
- [ ] **Step 4: Run** `node --test tests/` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: universal Faculty Laser with cosmetic-only faculty VFX`

### Task 4: Right-side statistics panel

**Files:**
- Modify: `index.html` (remove old tracker UI/`renderDamageStats`/`toggleStats`/`setStatsTab`; add `#statsPanel`, edge toggle, tabs, responsive drawer CSS, renderer, result-screen snapshot)
- Test: `tests/panel.test.js`

**Interfaces:**
- Consumes: `CombatStats.getAllCharacterStats()`, `faculties`, `battle.t`.
- Produces: `statsTab: 'dmg'|'def'|'heal'`, `setStatsTab(tab)`, `toggleStatsPanel()`, `statsRows(tab): Array<{id, name, faculty, value}>` sorted desc (pure, testable), `renderStatsPanel(force)` (throttled 200 ms, called from `updateHud`), `battle.finalStats` snapshot set in `finish()` and used by the result screen.

- [ ] **Step 1: Write failing tests**: `statsRows('dmg')` sorted descending with faculty label and value from CombatStats; `'def'`/`'heal'` use totalDefense/totalHealing; zero-value heroes included last; `setStatsTab` changes no battle fields (`battle.t`, `units`, `at` identical before/after) ; `toggleStatsPanel` flips visibility without pausing; `finish()` stores `battle.finalStats` and further `startBattle()` resets live stats but result screen rows come from the snapshot; renderer does not throw with an empty team result / battle null.
- [ ] **Step 2: Run** `node --test tests/panel.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** the panel as an absolutely positioned right drawer inside the battle section (does not shift the canvas on desktop ≥ 900 px; overlay drawer below that), edge toggle button, tab colours (DMG red/orange, DEF blue, HEAL green), animated bars via CSS width transition, battle time mm:ss, laser damage line, and a stats block on the result screen. Remove every reference to the old tracker.
- [ ] **Step 4: Run** `node --test tests/` — Expected: PASS; then open `index.html` in a browser (or the built-in browser/Chrome tool if available) and check: open/close, tab switching, live updates, pause/resume, victory/defeat, retry, narrow window. Record exactly what was and was not verified.
- [ ] **Step 5: Commit** `feat: right-side DMG/DEF/HEAL statistics panel`
