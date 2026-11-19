# Combat Statistics Panel + Universal Faculty Laser — Short Design

Status: approved by user ("ลุย") on 2026-11-18. Source request: pasted "CLAUDE DEVELOPMENT PROMPT" (Tasks A/B/C).

## Intent
A: collapsible right-side realtime DMG / DEF / HEAL panel built from real combat events. B: one shared "Faculty Laser" base skill, identical numbers for every faculty, faculty-specific cosmetics only.

## Goals
- Single authoritative `CombatStats` (JS, same file) with recordDamage/recordDefense/recordHealing/getAllCharacterStats/resetBattleStats; aggregated per character type across deployments.
- DMG: actual HP damage only (no overkill, no shield damage); summoned-unit and DoT damage credited to the owner hero; base skill/laser damage kept separate.
- DEF: damage actually absorbed by shields/barriers, credited to the shield provider; no credit for unused/expired shields; no double counting. (Game has no per-character DEF stat; none is added.)
- HEAL: effective healing only (overheal excluded), attributed to the healer.
- Panel: right side, open/close button on right edge, 3 tabs (DMG red/orange, DEF blue, HEAL green), sorted desc, faculty + value + animated bar, ~200 ms refresh, drawer/overlay on small screens, final stats kept on result screen, reset on new battle.
- Faculty Laser: shared `FACULTY_LASER {damage:500, cooldown:45, knockback:0, stun:0, slow:0, hits:1}`; hits every enemy once per activation along the lane; no damage to enemy base; cosmetic-only `FACULTY_LASER_VFX` by faculty id with default fallback; same code path for all 22 faculties.

## Non-goals
Rebalancing characters, adding a DEF stat, new rarity names, migrating to TypeScript/Phaser.

## Anti-goals
Faculty choice changing laser numbers; fake/estimated stats; duplicate stats windows; non-functional buttons; changing ultimate/synergy/boss behavior from the previous branch.

## Constraints
Single `index.html`; existing 12 heroes, AT economy, chibi art, unique skills preserved. Builds on branch `feature/gameplay-depth` (not yet merged).

## Approaches
1. Refactor existing tracker into CombatStats + new panel, hook recording into `damage()` and heal/shield code (chosen).
2. Bolt a second tracker beside the old one: rejected (duplicate, spec forbids).

## Design notes
- Owner attribution: summoned dog gets `owner` = summoner hero id; `damage(..., sourceId)` resolves `ownerOf(sourceId)`.
- Shield tracking: each shield point has a provider: `u.shield` stays a number for rendering plus `u.shieldSrc` map {providerId: amount}; absorption consumes providers proportionally in insertion order and records DEF per provider. Mecha's self barrier credits Mecha; Health Guardian's zone shield credits Health Guardian.
- Heal: record min(heal, maxHp - hp).
- Poison: DoT already carries `poisonSource`.
- Old `damageDone/damageBase/damageTaken` replaced by CombatStats; old panel and its tabs removed; `baseSkillDamage` kept as a laser total shown under the panel.
- Rename Base Skill → Faculty Laser in UI; remove knockback.

## Left to builder
Exact visuals, drawer breakpoint, animation timing.
