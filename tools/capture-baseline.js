// Records the fixed combat scenarios into a JSON baseline so later changes can be compared exactly.
//   node tools/capture-baseline.js <out.json> [--html <older index.html>] [--note "text"]
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { runTrace } = require('../tests/lib/combat-trace');
const { SCENARIOS } = require('../tests/lib/combat-scenarios');

const args = process.argv.slice(2);
const out = args[0];
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
if (!out) { console.error('usage: node tools/capture-baseline.js <out.json> [--html file] [--note text]'); process.exit(1); }
const html = opt('--html');
let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { cwd: path.join(__dirname, '..') }).toString().trim(); } catch (e) { /* not a repo */ }

const traces = [];
for (const s of SCENARIOS) {
  const t = runTrace({ ...s, html });
  traces.push({ scenario: s.id, ...t });
  console.log(`${s.id}: ${t.outcome.ended ? (t.outcome.win ? 'victory' : 'defeat') : 'running'} t=${t.outcome.simTime.toFixed(1)} kills=${t.outcome.kills} spawns=${t.spawns.length} proj=${t.projectiles.length} randoms=${t.rng.mathRandomCalls}`);
}
// the same battle with the other quality settings / drawing every frame: shows how much the visuals influence combat
const variants = [];
const MODES = [{ fx: 'reduced' }, { fx: 'full', draw: true }, { fx: 'reduced', draw: true }];
if (args.includes('--with-off')) MODES.push({ fx: 'off' }, { fx: 'off', draw: true }); // only meaningful for code that has the off level
for (const s of SCENARIOS.slice(0, 3)) {
  for (const v of MODES) {
    const t = runTrace({ ...s, ...v, html });
    variants.push({ scenario: s.id, variant: v, ...t });
    console.log(`${s.id} ${JSON.stringify(v)}: digest ${t.digest.slice(0, 12)}`);
  }
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ meta: { commit, date: new Date().toISOString().slice(0, 10), note: opt('--note') || '', html: html ? path.basename(html) : 'index.html', scenarios: SCENARIOS.map((s) => s.id) }, traces, variants }, null, 1) + '\n');
console.log('wrote', out);
