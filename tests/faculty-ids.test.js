// Faculty IDs: the game's faculty table is the source of truth. Character configuration (character.json) must agree
// with the running game, generated files must match the configuration, and a faculty label can never change combat.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame, tick } = require('./harness');
const pipe = require('../tools/characters');

const CHARS = path.join(__dirname, '..', 'public', 'assets', 'characters');
const descriptors = () => fs.readdirSync(CHARS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(CHARS, d.name, 'character.json')))
  .map((d) => JSON.parse(fs.readFileSync(path.join(CHARS, d.name, 'character.json'), 'utf8')));

const game = () => loadGame(1, { lazy: true });
const heroTable = (g) => JSON.parse(g.run('JSON.stringify(heroes.map(h=>({id:h.id,name:h.name,f:h.f})))'));
const facultyIds = (g) => JSON.parse(g.run('JSON.stringify(faculties.map(f=>f[0]))'));

test('all 12 characters are configured, each with the faculty id the game gives that hero', () => {
  const g = game(), heroes = heroTable(g), cfg = descriptors();
  assert.equal(cfg.length, 12, 'twelve character.json files');
  assert.deepEqual(cfg.map((c) => c.id).sort(), heroes.map((h) => h.id).sort(), 'same ids as the hero table');
  for (const c of cfg) {
    const hero = heroes.find((h) => h.id === c.id);
    assert.equal(c.faculty, hero.f, `${c.id}: faculty ${c.faculty} must equal the game's ${hero.f}`);
  }
});

test('the three renamed faculty ids are the ones the game uses (IC, MS, SS)', () => {
  const cfg = Object.fromEntries(descriptors().map((c) => [c.id, c.faculty]));
  assert.deepEqual([cfg.global, cfg.music, cfg.runner], ['IC', 'MS', 'SS']);
});

test('every hero faculty id refers to a faculty that exists in the game', () => {
  const g = game(), ids = new Set(facultyIds(g));
  for (const h of heroTable(g)) assert.ok(ids.has(h.f), `${h.id}: faculty ${h.f} is not in the faculty list`);
  for (const c of descriptors()) assert.ok(ids.has(c.faculty), `${c.id}: configured faculty ${c.faculty} is not in the faculty list`);
});

test('character configuration agrees with the runtime: name, skill mode and faculty', () => {
  const g = game(), heroes = heroTable(g);
  for (const c of descriptors()) {
    const hero = heroes.find((h) => h.id === c.id);
    assert.equal(c.name, hero.name, `${c.id}: name`);
    assert.equal(c.signature.skillMode, g.run(`SKILL_MODE[${JSON.stringify(c.id)}]`), `${c.id}: skill mode`);
  }
});

test('generated sprites.json, manifest.js and fx.js match the configuration, and the full check has no errors', () => {
  const r = pipe.check(CHARS, { smoke: false });
  assert.ok(Array.isArray(r.errors) && Array.isArray(r.characters.length ? r.characters : [1]), 'check returned its report');
  assert.deepEqual(r.errors, [], 'configuration and generated files agree with the game');
});

// A faculty id is a label. Flip the three renamed ones back to their old codes in a second game: nothing in combat may differ.
const trace = (labels) => {
  const g = loadGame(7, { lazy: true });
  if (labels) for (const [id, f] of Object.entries(labels)) g.run(`heroes.find(h=>h.id==='${id}').f='${f}'`);
  g.run("team=['global','music','runner','night','bug','mecha'];screen='battle';startBattle(7);battle.at=1000");
  const snap = () => g.run(`JSON.stringify({
    t: Math.round(battle.t * 100), base: battle.baseHp, enemy: battle.enemyHp, kills: battle.kills,
    units: battle.units.map(u => [u.id, Math.round(u.hp), Math.round(u.x)]),
    enemies: battle.enemies.map(u => [u.id, Math.round(u.hp), Math.round(u.x)]),
    stats: CombatStats.getAllCharacterStats().map(({ facultyId, ...r }) => r) })`);
  for (const id of ['global', 'music', 'runner', 'night', 'bug', 'mecha']) g.run(`deploy('${id}')`);
  const frames = [];
  for (let i = 0; i < 6; i++) { tick(g, 10); g.run('battle.at=1000'); frames.push(snap()); }
  return frames;
};

test('changing a faculty id does not change the combat outcome (HP, positions, kills, damage, defense, healing)', () => {
  assert.deepEqual(trace(null), trace({ global: 'MUIC', music: 'MUSIC', runner: 'SC2' }));
});

test('the recorded combat baseline is still checked (rng-separation regression), so gameplay changes cannot hide behind a faculty label', () => {
  const src = fs.readFileSync(path.join(__dirname, 'rng-separation.test.js'), 'utf8');
  assert.ok(/regression: the current code reproduces the recorded "after" baseline/.test(src));
  assert.ok(/for \(const k of \['outcome', 'stats', 'spawns', 'projectiles', 'bossRain', 'inputs', 'checkpoints'\]\)/.test(src), 'outcome, spawns, projectiles and boss rain are still compared exactly');
  assert.ok(/assert\.equal\(now\.digest, rec\.digest/.test(src), 'the whole-battle digest is still compared exactly');
});
