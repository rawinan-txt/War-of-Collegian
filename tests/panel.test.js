const test = require('node:test');
const assert = require('node:assert');
const { loadGame, tick } = require('./harness');

function setup() {
  const g = loadGame();
  g.run('startBattle()');
  g.run("CombatStats.recordDamage('mecha',100);CombatStats.recordDamage('bug',300);CombatStats.recordDamage('lab',200);CombatStats.recordDefense('mecha',500);CombatStats.recordDefense('bug',50);CombatStats.recordHealing('night',700)");
  return g;
}
const rows = (g, tab) => g.run(`JSON.parse(JSON.stringify(statsRows('${tab}')))`);

test('DMG rows are sorted descending with name, faculty and value; zero rows come last', () => {
  const g = setup();
  const r = rows(g, 'dmg');
  assert.deepEqual(r.map((x) => x.id).slice(0, 3), ['bug', 'lab', 'mecha']);
  assert.deepEqual(r.map((x) => x.value).slice(0, 3), [300, 200, 100]);
  assert.equal(r[0].name, 'Bug Hunter');
  assert.match(r[0].faculty, /ICT/);
  assert.equal(r.length, 6);
  assert.deepEqual(r.slice(3).map((x) => x.value), [0, 0, 0]);
});

test('DEF and HEAL tabs read totalDefense / totalHealing', () => {
  const g = setup();
  assert.deepEqual(rows(g, 'def').slice(0, 2).map((x) => [x.id, x.value]), [['mecha', 500], ['bug', 50]]);
  assert.deepEqual(rows(g, 'heal').slice(0, 1).map((x) => [x.id, x.value]), [['night', 700]]);
});

test('switching tabs and toggling the panel never touch battle state', () => {
  const g = setup();
  const snap = () => g.run('JSON.stringify([battle.t,battle.at,battle.units.length,battle.enemies.length,battle.paused,battle.speed,battle.ended])');
  const before = snap();
  g.run("setStatsTab('def');setStatsTab('heal');setStatsTab('dmg');toggleStatsPanel();toggleStatsPanel()");
  assert.equal(snap(), before);
  g.run("setStatsTab('heal')");
  assert.equal(g.run('statsTab'), 'heal');
  assert.equal(g.run('battle.paused'), false);
});

test('toggleStatsPanel flips the open flag without pausing', () => {
  const g = setup();
  const open0 = g.run('statsOpen');
  g.run('toggleStatsPanel()');
  assert.equal(g.run('statsOpen'), !open0);
  assert.equal(g.run('battle.paused'), false);
});

test('renderStatsPanel writes sorted values and bars into the DOM', () => {
  const g = setup();
  g.run("if(!statsOpen)toggleStatsPanel();setStatsTab('dmg');renderStatsPanel(true)");
  assert.equal(g.run("document.getElementById('sval-bug').textContent"), '300');
  assert.equal(g.run("document.getElementById('sbar-bug').style.width"), '100%');
  assert.equal(g.run("document.getElementById('sbar-mecha').style.width"), '33.3%');
  assert.equal(g.run("document.getElementById('srow-bug').style.order"), '0');
  g.run("setStatsTab('heal')");
  assert.equal(g.run("document.getElementById('sval-night').textContent"), '700');
});

test('statistics update during battle from real combat events', () => {
  const g = loadGame();
  g.run("startBattle();battle.at=5000;deploy('bug');spawnEnemy('basic');{const e=battle.enemies[0];e.hp=e.maxHp=100000;e.x=battle.units[0].x+100}");
  tick(g, 1.0);
  g.run("if(!statsOpen)toggleStatsPanel();renderStatsPanel(true)");
  assert.equal(g.run("document.getElementById('sval-bug').textContent"), '43'); // 39 ATK x1.1 Tech Alliance (default team has ICT + EG)
});

test('finish() keeps final stats for the result screen even after live stats reset', () => {
  const g = setup();
  g.run('finish(true)');
  g.run('CombatStats.resetBattleStats()');
  assert.equal(rows(g, 'dmg')[0].value, 300);
  assert.match(g.run("document.getElementById('resultStats').innerHTML"), /Bug Hunter/);
  assert.match(g.run("document.getElementById('resultStats').innerHTML"), /300/);
});

test('retry (startBattle) starts from zero and clears the snapshot', () => {
  const g = setup();
  g.run('finish(false)');
  g.run('startBattle()');
  assert.equal(g.run('battle.finalStats'), undefined);
  assert.deepEqual(rows(g, 'dmg').map((x) => x.value), [0, 0, 0, 0, 0, 0]);
  assert.equal(g.run("document.getElementById('sval-bug').textContent"), '0');
});

test('renderStatsPanel is safe with no battle, when paused, and with draw/updateHud', () => {
  const g = loadGame();
  g.run('renderStatsPanel(true)');
  g.run("startBattle();battle.paused=true;screen='battle';renderStatsPanel(true);updateHud();draw()");
  assert.equal(g.run('battle.paused'), true);
});
