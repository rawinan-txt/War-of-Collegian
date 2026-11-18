// Phase 3: combat and visual randomness are separate streams. Visual quality must never change a battle.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { runTrace, gameplayView, TEAMS } = require('./lib/combat-trace');
const { SCENARIOS } = require('./lib/combat-scenarios');
const { loadGame } = require('./harness');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scenario = (id) => SCENARIOS.find((s) => s.id === id);
const short = (s, duration) => ({ ...s, duration });

// ---------------------------------------------------------------- source level
test('Math.random is only used to pick a battle seed; every other draw is explicitly combat (crand) or visual (vrand)', () => {
  assert.equal((html.match(/Math\.random/g) || []).length, 1, 'one Math.random: the seed when none is given');
  assert.match(html, /function newRngs\(seed\)\{const s=\(seed!==undefined\?seed:NEXT_SEED!==null\?NEXT_SEED:Math\.floor\(Math\.random\(\)\*4294967296\)\)/);
  const fn = (name) => { const i = html.indexOf(`function ${name}(`); return html.slice(i, html.indexOf('\n', i)); };
  const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
  // visual code draws only from the visual stream
  assert.ok(/vrand\(\)/.test(fn('fxBurst')) && !/crand\(\)/.test(fn('fxBurst')));
  const draw = fn('draw');
  assert.ok(/vrand\(\)/.test(draw) && !/crand\(\)/.test(draw));
  // simulation code never touches the visual stream
  for (const name of ['update', 'spawnEnemy', 'bumpEnemy', 'makeUnit', 'damage', 'bossPhase', 'applyAttack', 'resolvePend', 'launchProjectile', 'updateProjectiles']) {
    assert.ok(!/vrand\(\)/.test(code(fn(name))), `${name} must not draw from the visual stream`);
  }
  // the combat draws are exactly the documented ones
  const crandSites = [...html.matchAll(/crand\(\)/g)].length;
  assert.equal(crandSites, 7, 'combat draws: unit y jitter, walk phase, enemy spawn x, enemy y jitter, boss rain x, damage-number jitter, enemy type pick');
  assert.equal([...html.matchAll(/vrand\(\)/g)].length, 5, 'visual draws: 3 per particle burst, 2 for screen shake');
});

// ---------------------------------------------------------------- stream isolation at run time
function battleGame(seed = 3) {
  const g = loadGame(seed, { lazy: true });
  g.run(`team=['bug','mecha','night','lab','chem','dental'];screen='battle';startBattle(${seed});battle.at=1000`);
  return g;
}
const draws = (g) => JSON.parse(g.run('JSON.stringify({c:battle.rng.combat.draws,cs:battle.rng.combat.state,v:battle.rng.vfx.draws,vs:battle.rng.vfx.state})'));

test('visual operations never consume the combat stream; simulation operations never consume the visual stream', () => {
  const g = battleGame();
  g.run('deploy("bug");deploy("mecha")');
  const before = draws(g);
  g.run('for(let i=0;i<200;i++){fxBurst(100,100,"#fff",20,3);fxRing(100,100,"#fff",10);fxBeam(0,0,200,0,"#fff");fxSpawn(1,1,0,0,.5,"#fff",3,0);fxShake(3);draw()}');
  const afterVfx = draws(g);
  assert.equal(afterVfx.c, before.c, 'combat draws unchanged by 200 rounds of effects and drawing');
  assert.equal(afterVfx.cs, before.cs, 'combat state unchanged');
  assert.ok(afterVfx.v > before.v + 1000, 'the visual stream did the work');
  g.run('for(let i=0;i<30;i++)spawnEnemy("basic");spawnEnemy("boss");for(let i=0;i<5;i++){update(1/30)}');
  const afterSim = draws(g);
  assert.ok(afterSim.c > afterVfx.c, 'spawning consumed combat draws');
  assert.ok(afterSim.v >= afterVfx.v, 'visual stream untouched by the simulation itself');
});

test('effects off does not touch the visual stream at all and draws no particles or shake', () => {
  const g = battleGame();
  g.run('setFxLevel("off");deploy("bug")');
  const v0 = draws(g).v;
  g.run('for(let i=0;i<50;i++){fxBurst(100,100,"#fff",20,3);fxRing(1,1,"#fff",9);fxBeam(0,0,100,0,"#fff");fxSpawn(1,1,0,0,.5,"#fff",3,0);fxShake(5)}');
  assert.equal(g.run('battle.particles.length'), 0);
  assert.equal(g.run('battle.shake'), 0);
  assert.equal(draws(g).v, v0);
  g.run('setFxLevel("reduced");fxBurst(1,1,"#fff",10,3)');
  assert.equal(g.run('battle.particles.length'), 5, 'reduced: half the particles');
  g.run('setFxLevel("full");battle.particles.length=0;fxBurst(1,1,"#fff",10,3)');
  assert.equal(g.run('battle.particles.length'), 10);
  assert.equal(g.run('fxLevel'), 'full');
  g.run('setFxLevel("bogus")');
  assert.equal(g.run('fxLevel'), 'full', 'unknown values still mean full');
});

test('a visual stream that throws cannot affect combat (effects off never reaches it)', () => {
  const g = battleGame(5);
  g.run('setFxLevel("off");battle.rng.vfx={next(){throw new Error("vfx stream touched")},get state(){return 0},get draws(){return 0}}');
  g.run('for(const id of team)deploy(id)');
  for (let i = 0; i < 60 * 30; i++) g.run('update(1/30)'); // would throw if the simulation drew visual numbers
  assert.ok(g.run('battle.t') > 59);
});

// ---------------------------------------------------------------- seeds
test('seeds: explicit seed, setBattleSeed, derived visual seed, one Math.random only when no seed is given', () => {
  const g = loadGame(9, { lazy: true });
  g.run('team=["bug"];screen="battle";globalThis.__n=0;const _r=Math.random;Math.random=function(){__n++;return _r()}');
  g.run('startBattle(1234)');
  assert.equal(g.run('battle.seed'), 1234);
  assert.equal(g.run('__n'), 0, 'explicit seed: Math.random not used');
  assert.notEqual(g.run('battle.rng.vfx.state'), g.run('battle.rng.combat.state'), 'visual seed is derived and different');
  g.run('setBattleSeed(77);startBattle()');
  assert.equal(g.run('battle.seed'), 77);
  assert.equal(g.run('__n'), 0);
  g.run('setBattleSeed(null);startBattle()');
  assert.equal(g.run('__n'), 1, 'no seed: exactly one Math.random for the battle seed');
  assert.equal(g.run('battle.seed'), g.run('battle.rng.combat.state') === 0 ? 0 : g.run('battle.seed'));
  // same seed, same battle; different seed, different battle
  const run = (seed) => runTrace({ ...short(scenario('s1-mixed'), 40), seed: 4, combatSeed: seed }).digest;
  assert.equal(run(2024), run(2024));
  assert.notEqual(run(2024), run(2025));
});

// ---------------------------------------------------------------- the requirement: visual quality never changes a battle
const MODES = [{ fx: 'full' }, { fx: 'reduced' }, { fx: 'off' }, { fx: 'full', draw: true }, { fx: 'reduced', draw: true }, { fx: 'off', draw: true }];
const same = (id, duration, modes = MODES) => {
  const s = short(scenario(id), duration);
  const traces = modes.map((m) => runTrace({ ...s, ...m }));
  const ref = gameplayView(traces[0]);
  traces.forEach((t, i) => assert.deepEqual(gameplayView(t), ref, `${id}: ${JSON.stringify(modes[i])} differs from full`));
  return traces;
};

test('identical battles for full / reduced / off effects, with and without drawing: HP, positions, damage, defense, healing, kills, projectiles, outcome, combat RNG state', () => {
  for (const id of ['s1-mixed', 's2-support', 's3-tanky']) {
    const traces = same(id, 60);
    const t = traces[0];
    assert.ok(t.projectiles.length > 50 && t.spawns.length > 10 && t.stats.rows.reduce((a, r) => a + r.totalDamage, 0) > 1000, 'the scenario really fights');
    // the visual stream did differ between modes, so the comparison is not vacuous
    const v = traces.map((x) => x.rng.vfx.draws);
    assert.ok(v[0] > v[1] && v[1] > 0 && v[2] === 0, `visual draws full ${v[0]} > reduced ${v[1]} > off ${v[2]}`);
    assert.ok(traces.every((x) => x.rng.combat.draws === t.rng.combat.draws && x.rng.combat.state === t.rng.combat.state), 'combat stream identical');
  }
});

test('identical battles with boss rain, 2x speed and pause/resume in every visual mode', () => {
  const three = [{ fx: 'full' }, { fx: 'reduced', draw: true }, { fx: 'off', draw: true }];
  for (const id of ['s7-mixed-2x', 's8-support-pause', 's9-tanky-2x-pause']) same(id, scenario(id).duration > 60 ? 60 : scenario(id).duration, three);
  const boss = same('s10-mixed-boss', 100, three);
  assert.ok(boss[0].bossRain.length > 0, 'boss rain positions (a combat decision) were exercised: ' + boss[0].bossRain.length);
  assert.ok(boss[0].spawns.some((s) => s.type === 'boss'));
});

test('several seeds and teams: damage, defense, healing and kills match across all modes', () => {
  for (const seed of [21, 22, 23]) for (const teamName of ['mixed', 'support', 'tanky']) {
    const s = { id: `x${seed}${teamName}`, seed, team: TEAMS[teamName], duration: 45, speed: 1 };
    const a = runTrace({ ...s, fx: 'full' }), b = runTrace({ ...s, fx: 'off', draw: true }), c = runTrace({ ...s, fx: 'reduced' });
    assert.deepEqual(gameplayView(b), gameplayView(a), `${seed}/${teamName} off vs full`);
    assert.deepEqual(gameplayView(c), gameplayView(a), `${seed}/${teamName} reduced vs full`);
  }
});

// ---------------------------------------------------------------- recorded baselines
const load = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'baselines', f), 'utf8'));

test('baseline "before" documents the defect, baseline "after" documents the fix', () => {
  const before = load('phase3-before.json'), after = load('phase3-after.json');
  assert.equal(before.meta.commit, '9d3625e');
  const differs = (b) => b.variants.filter((v) => v.digest !== b.traces.find((t) => t.scenario === v.scenario).digest).length;
  assert.ok(differs(before) >= 6, 'before: visual settings changed the battle in ' + differs(before) + ' of ' + before.variants.length + ' variants');
  assert.equal(differs(after), 0, 'after: no variant differs');
  assert.ok(after.variants.length > before.variants.length, 'after also covers the off level');
  assert.ok(before.traces.every((t) => t.rng.mathRandomCalls > 5000), 'before: thousands of draws from the one Math.random stream');
  assert.ok(after.traces.every((t) => t.rng.mathRandomCalls === 1 && t.rng.combat.draws < 1000 && t.rng.vfx.draws > 3000), 'after: 1 Math.random, few combat draws, many visual draws');
});

test('regression: the current code reproduces the recorded "after" baseline exactly (digest, outcome, stats, spawns, projectiles, boss rain)', () => {
  const after = load('phase3-after.json');
  for (const id of ['s1-mixed', 's2-support', 's7-mixed-2x', 's8-support-pause', 's10-mixed-boss']) {
    const rec = after.traces.find((t) => t.scenario === id);
    const s = scenario(id);
    const now = runTrace(s);
    assert.equal(now.digest, rec.digest, `${id}: combat changed (digest)`);
    for (const k of ['outcome', 'stats', 'spawns', 'projectiles', 'bossRain', 'inputs', 'checkpoints']) assert.deepEqual(now[k], rec[k], `${id}: ${k}`);
    assert.deepEqual(now.rng.combat, rec.rng.combat, `${id}: combat RNG state`);
  }
});
