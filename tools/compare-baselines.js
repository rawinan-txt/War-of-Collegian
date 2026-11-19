// Compares two baseline files written by tools/capture-baseline.js.
//   node tools/compare-baselines.js <before.json> <after.json> [--md <out.md>]
const fs = require('node:fs');

const [, , beforeFile, afterFile, ...rest] = process.argv;
if (!beforeFile || !afterFile) { console.error('usage: node tools/compare-baselines.js <before.json> <after.json> [--md out.md]'); process.exit(1); }
const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8')), after = JSON.parse(fs.readFileSync(afterFile, 'utf8'));
const mdOut = rest.indexOf('--md') >= 0 ? rest[rest.indexOf('--md') + 1] : null;

const dmg = (t) => t.stats.rows.reduce((s, r) => s + r.totalDamage, 0);
const def = (t) => t.stats.rows.reduce((s, r) => s + r.totalDefense, 0);
const heal = (t) => t.stats.rows.reduce((s, r) => s + r.totalHealing, 0);
const fmt = (n) => (Math.round(n * 10) / 10).toString();
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };

const lines = [];
const out = (s = '') => lines.push(s);
out(`# Combat RNG baseline comparison`);
out();
out(`Before: ${before.meta.note} (recorded ${before.meta.date}, commit ${before.meta.commit}, ${before.meta.html}).`);
out(`After: ${after.meta.note} (recorded ${after.meta.date}).`);
out();
out('## 1. Same seed, different visual settings (the defect and the fix)');
out();
out('Same scenario, same seed, same scripted inputs; only the effects level or drawing every frame changes.');
out();
out('| Scenario | Variant | Before: kills / enemy HP / digest equal to main? | After: kills / enemy HP / digest equal to main? |');
out('|---|---|---|---|');
for (const v of after.variants) {
  const bMain = before.traces.find((t) => t.scenario === v.scenario), aMain = after.traces.find((t) => t.scenario === v.scenario);
  const bv = before.variants.find((x) => x.scenario === v.scenario && JSON.stringify(x.variant) === JSON.stringify(v.variant));
  const cell = (main, x) => x ? `${x.outcome.kills} / ${fmt(x.outcome.enemyHp)} / ${x.digest === main.digest ? 'equal' : 'DIFFERENT'}` : 'n/a (level did not exist)';
  out(`| ${v.scenario} | ${JSON.stringify(v.variant)} | ${cell(bMain, bv)} | ${cell(aMain, v)} |`);
}
out();
out('## 2. Per scenario, before vs after (same seed number, different random streams)');
out();
out('The random draws a seed produces are different now (see section 3), so individual battles differ. Mechanics, stats and formulas are unchanged.');
out();
out('| Scenario | Kills b/a | DMG total b/a | DEF total b/a | HEAL total b/a | Enemy spawns b/a | Projectiles b/a | Boss-rain events b/a |');
out('|---|---|---|---|---|---|---|---|');
const rows = [];
for (const a of after.traces) {
  const b = before.traces.find((t) => t.scenario === a.scenario);
  if (!b) continue;
  rows.push({ b, a });
  out(`| ${a.scenario} | ${b.outcome.kills}/${a.outcome.kills} | ${fmt(dmg(b))}/${fmt(dmg(a))} | ${fmt(def(b))}/${fmt(def(a))} | ${fmt(heal(b))}/${fmt(heal(a))} | ${b.spawns.length}/${a.spawns.length} | ${b.projectiles.length}/${a.projectiles.length} | ${b.bossRain.length}/${a.bossRain.length} |`);
}
out();
out('## 3. Aggregate over all scenarios (mean +- standard deviation)');
out();
out('| Metric | Before | After |');
out('|---|---|---|');
const agg = (label, f) => { const bs = rows.map((r) => f(r.b)), as = rows.map((r) => f(r.a)); out(`| ${label} | ${fmt(mean(bs))} +- ${fmt(sd(bs))} | ${fmt(mean(as))} +- ${fmt(sd(as))} |`); };
agg('kills', (t) => t.outcome.kills);
agg('damage dealt (all heroes)', dmg);
agg('damage mitigated (DEF)', def);
agg('healing', heal);
agg('enemy spawns', (t) => t.spawns.length);
agg('projectiles launched', (t) => t.projectiles.length);
agg('base HP at end', (t) => t.outcome.baseHp);
agg('enemy base HP at end', (t) => t.outcome.enemyHp);
out();
out('## 4. Random draws');
out();
out(`Before: every draw came from one \`Math.random\` stream shared by combat and visuals. Average ${fmt(mean(rows.map((r) => r.b.rng.mathRandomCalls)))} draws per battle, of which only a few dozen decide combat (the rest are particles); the exact split cannot be recovered because the stream was interleaved.`);
const cd = rows.map((r) => r.a.rng.combat.draws), vd = rows.map((r) => r.a.rng.vfx.draws);
out(`After: combat stream ${fmt(mean(cd))} draws per battle on average (min ${Math.min(...cd)}, max ${Math.max(...cd)}), VFX stream ${fmt(mean(vd))} (min ${Math.min(...vd)}, max ${Math.max(...vd)}), \`Math.random\` ${[...new Set(rows.map((r) => r.a.rng.mathRandomCalls))].join('/')} call per battle (the battle seed).`);
const text = lines.join('\n') + '\n';
if (mdOut) fs.writeFileSync(mdOut, text);
console.log(text);
