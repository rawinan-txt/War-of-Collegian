// Compares what every hero's skill effect does now with the snapshot taken from the hand-written effects
// (tests/baselines/phase4-skillfx-before.json): same top-level fx calls, same particles, same visual random draws,
// no combat draws, same reduced/off behaviour.
//   node tools/compare-skillfx.js [id ...]      (default: all heroes)
const { mapEffects } = require('./map-skill-fx');
const before = require('../tests/baselines/phase4-skillfx-before.json');

const EPS = 1e-9;
const same = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= EPS : a === b);
const sameList = (a, b) => a.length === b.length && a.every((x, i) => (Array.isArray(x) ? sameList(x, b[i]) : same(x, b[i])));

function compare(ids) {
  const now = mapEffects();
  const report = {};
  for (const id of ids) {
    const b = before[id], n = now[id], problems = [];
    if (!b || !n) { report[id] = ['missing']; continue; }
    if (b.kind !== n.kind) problems.push(`kind ${b.kind} -> ${n.kind}`);
    if (b.mode !== n.mode) problems.push(`mode ${b.mode} -> ${n.mode}`);
    if (!sameList(b.full.ops, n.full.ops)) problems.push(`top-level fx calls differ: ${JSON.stringify(b.full.ops).slice(0, 160)} vs ${JSON.stringify(n.full.ops).slice(0, 160)}`);
    if (!sameList(b.full.particleList, n.full.particleList)) problems.push('particles differ');
    for (const level of ['full', 'reduced', 'off']) {
      for (const k of ['particles', 'vfxDraws', 'combatDraws', 'shake']) if (b[level][k] !== n[level][k]) problems.push(`${level}.${k} ${b[level][k]} -> ${n[level][k]}`);
    }
    report[id] = problems;
  }
  return report;
}
module.exports = { compare };

if (require.main === module) {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(before);
  const report = compare(ids);
  let bad = 0;
  for (const [id, p] of Object.entries(report)) { console.log(`${id}: ${p.length ? 'DIFFERENT' : 'identical'}`); p.forEach((x) => console.log('   ' + x)); bad += p.length; }
  process.exit(bad ? 1 : 0);
}
