# War of Collegian — Backlog

Known issues and ideas that were found and deliberately **not** changed. Each item needs an explicit decision (several touch player rules, stats or combat).
Evidence: `docs/ENEMY_SYSTEM.md` (Balance) and `docs/enemy-remodel/balance-summary.json`, produced by `node tools/sim-balance.js`.

## Balance / gameplay
1. **Tank-heavy teams lose consistently.**
   Team mecha, public, dental, runner, night, lab wins 0 % in Stage 1 and Stage 2 (8 seeds each, two deploy policies). It exists without the new enemies: the team has almost no cheap ranged damage, so it cannot kill the boss in time.
   Options: review hero stats/costs of that composition, or add a ranged-friendly Synergy. Needs approval (changes player stats).
2. **Bug Hunter solo deployment dominates Stage 1.**
   Spamming only Bug Hunter (cheapest unit, 80 AT) wins 8/8 of Stage 1 and 3/8 of Stage 2: units can be deployed up to the 35-unit cap and ranged units stack their damage bonus. Mecha alone wins 0/8.
   Option: a per-hero deployed-unit cap. Needs approval (changes player rules).

## Boss / enemy design
3. **Boss area attacks cannot be dodged manually.**
   The game is auto-battle, so heroes cannot leave the ring. The Exam Master / Final Exam rings are a readable cue and a damage limit (115 / 160, one or two rings, 1.5 s / 1 s warning), not a dodge mechanic.
   Options: let heroes with a dash (runner) step out, add a tap-to-shield action, or give the rings a visible countdown.
4. **Boss Spawn and Phase Transition animations are missing.**
   Phase changes use the cast pose, the on-screen notice and the warning rings. Dedicated `spawn` and `phase` sheets (and an entrance effect) are not made.

## Art / polish
5. **Enemy frames are posed from the approved drawings, not hand-drawn per frame.** Limbs move as rigid blocks. Candidates for hand redraw: the bosses and the Professor's pen arm.
6. **Final visual quality sign-off** of the enemy animations in the real game is pending the maintainer's review (`docs/enemy-remodel/preview.html`).

## Auto Play (see docs/AUTO_PLAY.md)
7. **Auto does not use the Ultimate.** Adding it would be a small extension (same rules as a human); left out of the first milestone.
8. **Auto is weaker than a cheap-unit spammer in Stage 1** and much stronger than the scripted baseline in Stage 2 (94 %): Stage 2 may deserve a retune against a smarter player. Not changed (no balance edits in the Auto milestone).
9. **Auto options (laser / AT upgrade) are not saved between sessions.**

## Stages 3-5
10. **Stage 3 is much harder for Auto than for the scripted policy** (22 % vs 75 %): the Final Exam boss with a scaled roster punishes Auto's "save for better units" rule. Not retuned.
11. **No stage unlock or progress tracking**: all five stages can be picked from the start; there is no best-clear record.
12. **Stage 5 needs a stronger team to clear**; tank-heavy teams never clear any stage.
