# Gameplay Depth (Stage 1) — Short Design

Status: approved by user ("ลุย") on 2026-11-18.

## Intent
Make the single existing stage more strategic and fun before building meta systems. Proves the core battle (README MVP v0.1 goal) and follows "Strategy Before Rarity".

## Goals
- Ultimate Meter with 3 selectable ultimates (Wi-Fi Down, Salaya Rain, Campus Shuttle)
- Faculty Synergy based on character faculty only (never player faculty)
- 3-phase Final Exam boss with telegraphed attacks
- Rebalance so mixed-faculty teams win and no single hero dominates

## Non-goals
Character upgrade, multiple stages, save system, guild/ranking, migration to Phaser/TS/Vite.

## Anti-goals
- Player faculty must not grant combat bonuses or restrict heroes
- No hidden mechanics: synergy and boss attacks must be visible to the player

## Constraints
Keep `index.html` as one file (GitHub Pages demo keeps working). Data-driven tables (heroes, synergies, ultimates) so later migration is easy.

## Approaches
1. Keep single file, add features (chosen): fastest path to a playable feel.
2. Split into modules / migrate to Phaser+Vite first: matches TECH_ARCHITECTURE but delays gameplay with no player-visible change. Deferred until save/multi-stage work.

## Design
- **Ultimate**: meter 0–100. Gain: +dmg dealt/20, +8 per kill, +dmg taken/30 (tune). Pick 1 of 3 on team screen. Wi-Fi Down: stun all enemies 3s. Salaya Rain: enemy speed -40% for 8s. Campus Shuttle: sweeping bus, damage + knockback. HUD button + meter.
- **Synergy**: table of rules evaluated from team hero faculties: same-faculty x3 (ICT: cooldown -8%), Healthcare network (heal +12%), ICT+EG Tech Alliance (+10% damage). Shown on team screen and applied at battle start.
- **Boss**: Phase 1 normal. Phase 2 (<50% HP) Exam Paper Rain: warning marks on lanes ~1s, then damage. Phase 3 (<20%) Overtime: attack speed +100%, damage +30%, visual change. Phase banner notice.
- **Balance**: tuned by sim/playtest of several team compositions; documented numbers in code constants.

## Left to builder
Exact numbers, visuals/VFX, text sketches of HUD placement.
