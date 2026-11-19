# 8-bit Pixel Art Characters & Animation — Short Design

Status: approved by user ("ลุย") on 2026-11-18, including the attack-timing change. Source: pasted "8-BIT PIXEL ART CHARACTER & ANIMATION MASTER PROMPT".

## Intent
Replace the canvas-drawn chibi heroes with original 8-bit-style 64x64 pixel sprites and frame animations (Idle 4, Walk 6, Attack 6, Skill 10, Hurt 3, Death 6) tied to real combat events, plus pixel VFX, without changing gameplay numbers.

## Goals
- All 12 existing heroes (+ the summoned dog) get real PNG sprite sheets under `assets/characters/<faculty>/<name>/<anim>.png`, produced by a Node generator (no image-gen tool exists; art is procedural pixel art built from a shared chibi rig + per-character palette/accessories — not hand-drawn).
- Reusable runtime animation controller + data config (`assets/characters/animations.js` / `.json`); one code path for all characters; fallback to the old canvas chibi if a sheet fails to load.
- Animations follow real combat state; damage lands at the attack's impact frame (melee) or on projectile arrival (ranged); combat/stat attribution stays authoritative.
- Unique skill animation + pixel skill VFX per hero; pixel-style universal Faculty Laser VFX (same gameplay); reduced-effects toggle.
- Existing stats, AT costs, cooldowns, signature skills, faculty/guild/base, laser, DMG/DEF/HEAL panel, win/lose/pause/retry all keep working.

## Non-goals
Hand-drawn art; pixel sprites for enemies/boss (they stay as the old canvas drawing this round — style mismatch is known); rebalancing; engine migration; official insignia.

## Anti-goals
Animation frames dealing damage; skills replaced by generic attacks; blurry/anti-aliased sprites; missing-texture crashes.

## Constraints
Single-file game + static assets (no build step; GitHub Pages). Code roster is the source of truth (12 heroes incl. Health Guardian, not Money Maker). Sprites must work when `index.html` is opened from disk (no fetch of JSON; config shipped as a JS file).

## Approaches
1. Procedural generator -> PNG sheets + runtime loader (chosen): satisfies "actual PNG assets", reusable, testable.
2. Runtime-only generation into offscreen canvases: no PNG deliverable; rejected.
3. Hand-authored pixel arrays per frame: huge, not maintainable; rejected.

## Design notes
- Attack sync: a unit that starts an attack sets its cooldown as before and queues a pending hit; melee damage applies at the impact frame time (~0.25s), ranged spawns a pooled projectile at the fire frame and applies damage on arrival (target dead => no damage). Attacker death/stun cancels an unlaunched swing; launched projectiles keep their original `srcOf` attribution. Enemies use the same timing (symmetry). Balance sim is run before/after and reported.
- Skill triggers: 'onDeploy' (mecha, global, runner), 'onPulse' (night, nurse heal pulses; animal summon; public shield pulse), 'onStack' (bug at max stack), 'every3' (lab, chem, music, dental: every 3rd attack plays the skill animation; damage identical).
- Death: visual-only corpse list plays the death sheet after the unit leaves combat. Hurt: visual only, 0.6s gap.
- Rendering: 64x64 frames drawn at 2x with imageSmoothingEnabled=false; feet baseline fixed; canvas uses `image-rendering: pixelated`.
- VFX: pooled square particles at integer coordinates; shake and flash scaled by an FX level (full/reduced).

## Left to builder
Exact palettes, accessory pixel shapes, frame-by-frame poses, VFX tuning.
