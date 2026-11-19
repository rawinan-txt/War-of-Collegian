# Combat RNG baseline comparison

Before: Phase 2 code (commit 9d3625e): one shared Math.random stream, before RNG separation (recorded 2026-11-18, commit 9d3625e, index.html).
After: Phase 3 code: separate COMBAT and VFX streams (recorded 2026-11-18).

## 1. Same seed, different visual settings (the defect and the fix)

Same scenario, same seed, same scripted inputs; only the effects level or drawing every frame changes.

| Scenario | Variant | Before: kills / enemy HP / digest equal to main? | After: kills / enemy HP / digest equal to main? |
|---|---|---|---|
| s1-mixed | {"fx":"reduced"} | 17 / 6500 / DIFFERENT | 21 / 6500 / equal |
| s1-mixed | {"fx":"full","draw":true} | 15 / 6500 / DIFFERENT | 21 / 6500 / equal |
| s1-mixed | {"fx":"reduced","draw":true} | 17 / 6500 / DIFFERENT | 21 / 6500 / equal |
| s1-mixed | {"fx":"off"} | n/a (level did not exist) | 21 / 6500 / equal |
| s1-mixed | {"fx":"off","draw":true} | n/a (level did not exist) | 21 / 6500 / equal |
| s1-support | {"fx":"reduced"} | 19 / 6462.8 / DIFFERENT | 24 / 6488.3 / equal |
| s1-support | {"fx":"full","draw":true} | 19 / 6439.4 / DIFFERENT | 24 / 6488.3 / equal |
| s1-support | {"fx":"reduced","draw":true} | 19 / 6462.8 / DIFFERENT | 24 / 6488.3 / equal |
| s1-support | {"fx":"off"} | n/a (level did not exist) | 24 / 6488.3 / equal |
| s1-support | {"fx":"off","draw":true} | n/a (level did not exist) | 24 / 6488.3 / equal |
| s1-tanky | {"fx":"reduced"} | 22 / 6500 / DIFFERENT | 23 / 6500 / equal |
| s1-tanky | {"fx":"full","draw":true} | 24 / 6500 / DIFFERENT | 23 / 6500 / equal |
| s1-tanky | {"fx":"reduced","draw":true} | 22 / 6500 / DIFFERENT | 23 / 6500 / equal |
| s1-tanky | {"fx":"off"} | n/a (level did not exist) | 23 / 6500 / equal |
| s1-tanky | {"fx":"off","draw":true} | n/a (level did not exist) | 23 / 6500 / equal |

## 2. Per scenario, before vs after (same seed number, different random streams)

The random draws a seed produces are different now (see section 3), so individual battles differ. Mechanics, stats and formulas are unchanged.

| Scenario | Kills b/a | DMG total b/a | DEF total b/a | HEAL total b/a | Enemy spawns b/a | Projectiles b/a | Boss-rain events b/a |
|---|---|---|---|---|---|---|---|
| s1-mixed | 16/21 | 9312.8/10203.4 | 320/320 | 10906/10869.4 | 29/29 | 244/218 | 0/0 |
| s1-support | 20/24 | 10832/14103.6 | 0/0 | 0/0 | 29/29 | 201/255 | 0/0 |
| s1-tanky | 25/23 | 14206.5/13436.6 | 0/0 | 9227.6/9020.2 | 29/29 | 208/186 | 0/0 |
| s2-mixed | 20/18 | 9863.5/9747 | 320/320 | 11907.8/10509.4 | 29/29 | 177/199 | 0/0 |
| s2-support | 23/17 | 12848.5/8684.1 | 0/0 | 0/0 | 29/29 | 242/194 | 0/0 |
| s2-tanky | 22/24 | 14079/13249.9 | 0/0 | 8216/9042 | 29/29 | 193/222 | 0/0 |
| s3-mixed | 21/15 | 10087.2/9698.7 | 320/320 | 9966.8/9634 | 29/29 | 136/187 | 0/0 |
| s3-support | 27/23 | 17491.6/14401.6 | 0/0 | 0/0 | 29/29 | 231/263 | 0/0 |
| s3-tanky | 21/25 | 12817.1/12659.8 | 0/0 | 5158/8343.8 | 29/29 | 213/219 | 0/0 |
| s4-mixed | 19/20 | 10721.9/10233.5 | 320/320 | 10368.2/9309.8 | 29/29 | 186/157 | 0/0 |
| s4-support | 19/20 | 13190.8/13420.7 | 0/0 | 0/0 | 29/29 | 245/259 | 0/0 |
| s4-tanky | 24/22 | 13283.2/13535 | 0/0 | 9105.2/8743.8 | 29/29 | 216/229 | 0/0 |
| s5-mixed | 20/19 | 9675.6/10598.7 | 320/320 | 10074.4/10206 | 29/29 | 136/222 | 0/0 |
| s5-support | 27/24 | 16262.7/15315.1 | 0/0 | 0/0 | 29/29 | 179/252 | 0/0 |
| s5-tanky | 22/19 | 14383.7/14818.8 | 0/0 | 9364.8/9335.2 | 29/29 | 195/190 | 0/0 |
| s6-mixed | 18/19 | 9838.5/10471.2 | 320/320 | 10453.8/10667 | 29/29 | 203/176 | 0/0 |
| s6-support | 25/20 | 18379.5/12961.7 | 0/0 | 0/0 | 29/29 | 196/301 | 6/0 |
| s6-tanky | 24/21 | 13261.2/14331 | 0/0 | 8870/10659 | 29/29 | 209/210 | 0/0 |
| s7-mixed-2x | 19/16 | 11646.3/10968.8 | 320/320 | 10971.2/11579.4 | 37/37 | 200/254 | 0/0 |
| s8-support-pause | 24/23 | 16632.3/13047.6 | 0/0 | 0/0 | 27/27 | 141/227 | 3/0 |
| s9-tanky-2x-pause | 39/36 | 22039.5/20086.1 | 0/0 | 11832/8270.8 | 43/43 | 305/299 | 0/0 |
| s10-mixed-boss | 24/17 | 12975.8/10238.7 | 320/320 | 12503.2/10537.4 | 39/39 | 235/228 | 21/21 |
| s11-tanky-boss | 24/25 | 15678/16524.1 | 0/0 | 7003/7851.6 | 39/39 | 212/227 | 21/21 |

## 3. Aggregate over all scenarios (mean +- standard deviation)

| Metric | Before | After |
|---|---|---|
| kills | 22.7 +- 4.5 | 21.3 +- 4.2 |
| damage dealt (all heroes) | 13456.8 +- 3138.1 | 12727.6 +- 2595 |
| damage mitigated (DEF) | 111.3 +- 152.4 | 111.3 +- 152.4 |
| healing | 6779.5 +- 4734.3 | 6720.8 +- 4531.3 |
| enemy spawns | 30.7 +- 4.1 | 30.7 +- 4.1 |
| projectiles launched | 204.5 +- 37.4 | 225 +- 35.8 |
| base HP at end | 5000 +- 0 | 4933.5 +- 280.6 |
| enemy base HP at end | 6176.7 +- 828.3 | 6489.4 +- 30.9 |

## 4. Random draws

Before: every draw came from one `Math.random` stream shared by combat and visuals. Average 11141.3 draws per battle, of which only a few dozen decide combat (the rest are particles); the exact split cannot be recovered because the stream was interleaved.
After: combat stream 620.2 draws per battle on average (min 510, max 800), VFX stream 9684 (min 7896, max 12429), `Math.random` 1 call per battle (the battle seed).
