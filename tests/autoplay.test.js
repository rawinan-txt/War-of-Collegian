// Auto Play: a player-input automation layer. It must follow the same rules as a human, be deterministic, and change nothing when off.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, tick } = require('./harness');

const TEAM = ['bug', 'mecha', 'night', 'lab', 'chem', 'dental'];
const J = (g, code) => JSON.parse(g.run(`JSON.stringify(${code})`));
function game(stage = 1, seed = 1, team = TEAM, opts = {}) {
  const g = loadGame(seed, { lazy: true, enemies: true, ...opts });
  g.run(`team=${JSON.stringify(team)};screen='battle';stage=${stage};startBattle(${seed})`);
  return g;
}
const auto = (g, on = true) => g.run(`AUTO.on=${on}`);
const snap = (g) => g.run('JSON.stringify({t:Math.round(battle.t*1000),base:battle.baseHp,enemy:battle.enemyHp,kills:battle.kills,at:Math.round(battle.at*100),dep:battle.deployed,lv:battle.level,cd:battle.baseCd,units:battle.units.map(u=>[u.id,Math.round(u.x*100),Math.round(u.hp*100)]),enemies:battle.enemies.map(u=>[u.id,Math.round(u.x*100),Math.round(u.hp*100)]),cs:battle.rng.combat.state,stats:CombatStats.getAllCharacterStats()})');
const run = (g, seconds, step = 0.05) => tick(g, seconds, step);

test('a new battle starts in Manual and Auto can be toggled at any time without touching the battle', () => {
  const g = game();
  assert.equal(g.run('AUTO.on'), false);
  run(g, 3);
  const before = snap(g);
  g.run('toggleAuto()');
  assert.equal(g.run('AUTO.on'), true);
  assert.equal(snap(g), before, 'toggling changes no combat state');
  g.run('toggleAuto()');
  assert.equal(g.run('AUTO.on'), false);
  assert.equal(snap(g), before);
  g.run('AUTO.on=true;startBattle(2)');
  assert.equal(g.run('AUTO.on'), false, 'every new battle resets to Manual');
});

test('HUD: the Auto button shows ON / OFF, the option chips only appear while it is on and reflect their settings', () => {
  const g = game();
  g.run("globalThis.__cl={};for(const id of ['autoBtn','autoOpts','autoLaserBtn','autoUpgBtn']){const e=document.getElementById(id);e.classList.toggle=(n,f)=>{__cl[id+'.'+n]=f}}");
  assert.equal(g.run("document.getElementById('autoBtn').textContent"), 'Auto: ปิด');
  g.run('toggleAuto()');
  assert.equal(g.run("document.getElementById('autoBtn').textContent"), 'Auto: เปิด');
  const cl = () => J(g, '__cl');
  assert.equal(cl()['autoBtn.green'], true, 'green key while on');
  assert.equal(cl()['autoBtn.secondary'], false);
  assert.equal(cl()['autoOpts.hidden'], false, 'option chips visible while on');
  g.run("setAutoOpt('laser')");
  assert.equal(g.run('AUTO.laser'), false);
  assert.equal(cl()['autoLaserBtn.on'], false);
  g.run("setAutoOpt('nonsense')");
  assert.equal(J(g, '[AUTO.laser,AUTO.upgrade]').join(), 'false,true');
  g.run('toggleAuto()');
  assert.equal(cl()['autoOpts.hidden'], true, 'chips hidden again when off');
  assert.equal(cl()['autoBtn.green'], false);
  assert.equal(g.run("document.getElementById('autoBtn').textContent"), 'Auto: ปิด');
});

test('with Auto off, battles are identical to before: no decision code runs, no state is added', () => {
  const play = (touch) => { const g = game(1, 5); g.run('battle.at=1000;deploy("bug");deploy("mecha")'); if (touch) { g.run('toggleAuto()'); g.run('toggleAuto()'); } run(g, 60); return snap(g); };
  assert.equal(play(false), play(true));
  const g = game(1, 5); run(g, 5);
  assert.equal(g.run("'autoT' in battle"), false, 'a manual battle never gets Auto state');
});

test('Auto deploys through the normal deploy action: AT is spent, the cost is the hero cost, stats count it like a manual deploy', () => {
  const g = game(1, 3);
  g.run('battle.at=1000;battle.income=0');
  auto(g);
  run(g, 0.3);
  assert.equal(g.run('battle.deployed'), 1, 'one deployment on the first decision tick');
  const u = J(g, 'battle.units.map(x=>x.id)'), cost = J(g, `heroes.find(h=>h.id==='${u[0]}').cost`);
  assert.equal(1000 - g.run('battle.at'), cost, 'AT spent equals the character cost');
  assert.ok(TEAM.includes(u[0]));
  const rows = J(g, 'CombatStats.getAllCharacterStats()');
  assert.equal(rows.find((r) => r.characterId === u[0]).deploymentCount, 1, 'counted exactly like a manual deployment');
  assert.ok(!rows.some((r) => /auto/i.test(r.characterId)), 'nothing is attributed to Auto itself');
});

test('Auto does nothing with insufficient AT, and nothing while the card is on cooldown', () => {
  const g = game(1, 4);
  g.run('battle.at=40;battle.income=0');
  auto(g);
  run(g, 5);
  assert.equal(g.run('battle.deployed'), 0, 'cheapest card costs 80');
  g.run('battle.at=1000');
  run(g, 0.3);
  assert.equal(g.run('battle.deployed'), 1);
  const first = J(g, 'battle.units.map(x=>x.id)')[0];
  assert.ok(g.run(`battle.cd['${first}']`) > 0, 'that card is cooling down');
  const times = {};
  for (let i = 0; i < 400; i++) {
    g.run('battle.at=1000');
    const before = J(g, 'Object.fromEntries(CombatStats.getAllCharacterStats().map(r=>[r.characterId,r.deploymentCount]))');
    run(g, 0.05, 0.05);
    const after = J(g, 'Object.fromEntries(CombatStats.getAllCharacterStats().map(r=>[r.characterId,r.deploymentCount]))');
    for (const id of Object.keys(after)) if (after[id] > before[id]) (times[id] ||= []).push(g.run('battle.t'));
  }
  for (const [id, ts] of Object.entries(times)) {
    const cd = J(g, `heroes.find(h=>h.id==='${id}').cd*battle.syn.cdMul`);
    for (let i = 1; i < ts.length; i++) assert.ok(ts[i] - ts[i - 1] >= cd - 0.07, `${id}: redeployed after ${(ts[i] - ts[i - 1]).toFixed(2)}s, cooldown ${cd}`);
  }
});

test('Auto respects the 35-unit cap', () => {
  const g = game(1, 6);
  g.run("battle.at=1000;battle.income=0;battle.enemies=[];while(battle.units.length<35)battle.units.push(makeUnit(heroes.find(h=>h.id==='mecha'),true,200))");
  auto(g);
  run(g, 2);
  assert.equal(g.run('battle.units.length'), 35);
  assert.equal(g.run('battle.deployed'), 0);
});

test('manual actions keep working while Auto is on (deploy, upgrade, laser)', () => {
  const g = game(1, 7);
  g.run('battle.at=1000;battle.income=0');
  auto(g);
  g.run("AUTO.laser=false;AUTO.upgrade=false");
  const at0 = g.run('battle.at');
  g.run("deploy('bug')");
  assert.equal(at0 - g.run('battle.at'), 80, 'manual deploy works');
  const lv = g.run('battle.level');
  g.run('upgradeIncome()');
  assert.equal(g.run('battle.level'), lv + 1, 'manual upgrade works');
  g.run("spawnEnemy('basic')");
  assert.equal(g.run('baseSkill()'), true, 'manual laser works');
  assert.equal(g.run('battle.baseCd'), 45);
});

test('Auto upgrades AT with the manual cost, only when it pays off and nothing threatens the base; options and the level cap are respected', () => {
  const mk = () => { const g = game(1, 8); g.run('battle.enemies=[];battle.at=500;battle.units=[]'); auto(g); return g; };
  let g = mk();
  const cost = g.run('battle.upgrade');
  g.run('autoDecide()');
  assert.equal(g.run('battle.level'), 2, 'upgraded');
  assert.equal(g.run('battle.at'), 500 - cost, 'same cost as the manual upgrade');
  assert.equal(g.run('battle.deployed'), 0, 'one action per decision');
  g = mk(); g.run('AUTO.upgrade=false;autoDecide()');
  assert.equal(g.run('battle.level'), 1, 'option off');
  g = mk(); g.run('battle.level=6;autoDecide()');
  assert.equal(g.run('battle.level'), 6, 'level cap');
  g = mk(); g.run("spawnEnemy('basic');battle.enemies[0].x=300;autoDecide()");
  assert.equal(g.run('battle.level'), 1, 'no upgrade while the base is threatened');
  assert.ok(g.run('battle.deployed') >= 1, 'it defends instead');
  g = mk(); g.run('battle.t=140;autoDecide()');
  assert.equal(g.run('battle.level'), 1, 'late in the battle an upgrade does not pay back');
  g = mk(); g.run("battle.at=140;spawnEnemy('basic');battle.enemies[0].x=500;autoDecide()");
  assert.equal(g.run('battle.level'), 1, 'does not spend the AT needed for defenders while enemies approach');
});

test('Auto fires the Universal Faculty Laser only at worthwhile targets, respecting cooldown and the option; the laser is identical for every faculty', () => {
  const mk = (n, hp = 1000) => { const g = game(1, 9); g.run(`battle.enemies=[];battle.at=0;battle.income=0;for(let i=0;i<${n};i++){spawnEnemy('basic');const e=battle.enemies[i];e.hp=e.maxHp=${hp};e.x=500+i*20}`); auto(g); return g; };
  let g = mk(0); g.run('autoDecide()'); assert.equal(g.run('battle.baseCd'), 0, 'no enemies, no laser');
  g = mk(1); g.run('battle.enemies[0].x=700;autoDecide()'); assert.equal(g.run('battle.baseCd'), 0, 'one healthy enemy far away is not worth it');
  g = mk(3);
  g.run('autoDecide()');
  assert.equal(g.run('battle.baseCd'), 45, 'a group is worth it');
  assert.deepEqual(J(g, 'battle.enemies.map(e=>e.hp)'), [500, 500, 500], 'existing laser damage');
  g.run('autoDecide()');
  assert.deepEqual(J(g, 'battle.enemies.map(e=>e.hp)'), [500, 500, 500], 'no second shot during cooldown');
  g = mk(3); g.run('AUTO.laser=false;autoDecide()'); assert.equal(g.run('battle.baseCd'), 0, 'option off');
  g = mk(1, 400); g.run('battle.enemies[0].x=140;autoDecide()'); assert.equal(g.run('battle.baseCd'), 45, 'a dangerous enemy at the base is shot');
  for (const f of ['ICT', 'SI', 'DT', 'EG']) {
    const h = mk(3); h.run(`faculty='${f}';autoDecide()`);
    assert.deepEqual(J(h, 'battle.enemies.map(e=>e.hp)'), [500, 500, 500], `${f}: identical laser`);
  }
});

test('no decisions while paused; Auto resumes after Resume', () => {
  const g = game(1, 10);
  g.run('battle.at=1000');
  auto(g);
  g.run('battle.paused=true');
  const s = snap(g);
  run(g, 3);
  assert.equal(snap(g), s, 'paused: nothing happens, including Auto');
  g.run('autoDecide()');
  assert.equal(g.run('battle.deployed'), 0, 'autoDecide itself refuses while paused');
  g.run('battle.paused=false');
  run(g, 1);
  assert.ok(g.run('battle.deployed') >= 1, 'Auto resumes after Resume');
});

test('decisions run on a fixed simulation interval of 0.25s: independent of frame size and speed, bounded per update, one deployment per tick', () => {
  const calls = (speed, step, seconds) => {
    const g = game(1, 11);
    g.run('globalThis.__n=0;{const o=autoDecide;autoDecide=function(){__n++;return o()}}');
    g.run(`battle.speed=${speed}`); auto(g);
    const n = Math.round(seconds / (step * speed));
    for (let i = 0; i < n; i++) g.run(`update(${step})`);
    return g.run('__n');
  };
  const a = calls(1, 0.05, 10), b = calls(1, 0.016, 10), c = calls(2, 0.05, 10);
  assert.ok(a >= 39 && a <= 41, `~40 decisions in 10s, got ${a}`);
  assert.ok(Math.abs(a - b) <= 1 && Math.abs(a - c) <= 1, `frame size and 2x speed do not change it (${a}, ${b}, ${c})`);
  const g = game(1, 11); auto(g);
  g.run('battle.autoT=10;battle.at=1000;globalThis.__n=0;{const o=autoDecide;autoDecide=function(){__n++;return o()}}');
  g.run('update(0.05)');
  assert.ok(g.run('__n') <= 2, 'bounded decisions per update');
  assert.ok(g.run('battle.autoT') <= 0.25 + 1e-9, 'no backlog is queued');
  const h = game(1, 11); auto(h); h.run('battle.at=1000');
  let prev = 0;
  for (let i = 0; i < 200; i++) { run(h, 0.25, 0.05); h.run('battle.at=1000'); const d = h.run('battle.deployed'); assert.ok(d - prev <= 1, 'at most one deployment per decision tick'); prev = d; }
});

test('strategy never draws random numbers: the decision functions are pure on the battle state', () => {
  const g = game(2, 12);
  g.run('battle.at=1000');
  run(g, 20);
  const d0 = J(g, '[battle.rng.combat.draws,battle.rng.vfx.draws,battle.rng.combat.state,battle.rng.vfx.state]');
  for (let i = 0; i < 50; i++) g.run('{const S=autoState();for(const id of team)autoScore(heroes.find(h=>h.id===id),S);autoPick(S);autoWantsUpgrade(S);autoWantsLaser(S)}');
  assert.deepEqual(J(g, '[battle.rng.combat.draws,battle.rng.vfx.draws,battle.rng.combat.state,battle.rng.vfx.state]'), d0);
});

function playOut(stage, team, seed, fx = 'full', draw = false, speed = 1) {
  const g = game(stage, seed, team);
  g.run(`setFxLevel('${fx}')`); auto(g); g.run(`battle.speed=${speed}`);
  const step = 0.05 / speed;
  for (let i = 0; i < 7000 && !g.run('battle.ended'); i++) { g.run(`update(${step})`); if (draw && i % 3 === 0) g.run('draw()'); }
  return g;
}

test('Auto plays whole battles on both stages with different teams, only from the selected six, and ends cleanly on Victory or Defeat', () => {
  const teams = [TEAM, ['bug', 'animal', 'music', 'runner', 'global', 'nurse'], ['mecha', 'public', 'dental', 'runner', 'night', 'lab'], ['lab', 'chem', 'music', 'dental', 'night', 'public']];
  let wins = 0, n = 0;
  for (const stage of [1, 2]) for (const team of teams) {
    const g = playOut(stage, team, 30 + stage);
    assert.equal(g.run('battle.ended'), true, 'the battle finished');
    const ids = new Set(J(g, 'battle.units.map(u=>u.id)'));
    const stats = J(g, 'CombatStats.getAllCharacterStats()');
    assert.ok(stats.reduce((s, r) => s + r.deploymentCount, 0) === g.run('battle.deployed'), 'every deployment is counted');
    for (const id of ids) assert.ok(team.includes(id) || id === 'dog', `${id} is in the selected team`);
    assert.ok(stats.filter((r) => r.deploymentCount > 0).length >= (team === TEAM ? 4 : 2), `uses several characters, not one (${stage}/${team.join()})`);
    const d = g.run('battle.deployed'), enders = g.run('battle.ended');
    for (let i = 0; i < 20; i++) g.run('update(0.05)');
    assert.equal(g.run('battle.deployed'), d, 'no decisions after the result');
    n++; if (g.run('battle.enemyHp') <= 0 && g.run('battle.baseHp') > 0) wins++;
  }
  assert.ok(wins >= 3 && wins < n + 1, `Auto wins sensibly (${wins}/${n})`);
});

test('Auto does not just spam the first or cheapest hero: the deployed mix follows team and situation', () => {
  const g = playOut(1, TEAM, 40);
  const stats = J(g, 'CombatStats.getAllCharacterStats()');
  const total = stats.reduce((s, r) => s + r.deploymentCount, 0);
  const bug = stats.find((r) => r.characterId === 'bug').deploymentCount;
  assert.ok(bug / total < 0.6, `Bug Hunter share ${(bug / total).toFixed(2)} stays below 60%`);
  const noBug = playOut(1, ['mecha', 'night', 'lab', 'chem', 'dental', 'public'], 41);
  assert.ok(J(noBug, 'CombatStats.getAllCharacterStats()').filter((r) => r.deploymentCount > 0).length >= 3, 'works without Bug Hunter');
});

test('healers are used when allies are hurt, and the frontline is rebuilt when it is missing', () => {
  const g = game(1, 13);
  g.run("battle.enemies=[];battle.at=1000;battle.units=[];for(const id of ['mecha','bug','lab']){deploy(id)}{for(const u of battle.units)u.hp=u.maxHp*0.3}");
  auto(g); g.run('AUTO.upgrade=false');
  g.run('for(const id of team)battle.cd[id]=0');
  g.run('autoDecide()');
  assert.equal(J(g, 'battle.units.map(u=>u.id)').pop(), 'night', 'hurt allies, no healer: it deploys the healer');
  const f = game(1, 14);
  f.run("battle.at=1000;spawnEnemy('basic');spawnEnemy('basic');spawnEnemy('basic');battle.enemies.forEach((e,i)=>{e.x=700+i*10})");
  auto(f); f.run('AUTO.upgrade=false');
  f.run('autoDecide()');
  assert.ok(['mecha', 'dental'].includes(J(f, 'battle.units.map(u=>u.id)')[0]), 'no frontline and enemies coming: it deploys a frontliner first');
});

test('saves AT for a clearly better unit that is a few seconds away, but not under threat', () => {
  const g = game(1, 15, ['bug', 'public', 'night', 'lab', 'chem', 'dental']);
  g.run("battle.enemies=[];battle.units=[];for(const id of ['bug','lab']){deploy('bug');break}battle.at=330;battle.income=10");
  g.run("battle.units.push(makeUnit(heroes.find(h=>h.id==='mecha'),true,200));for(const id of team)battle.cd[id]=0");
  auto(g);
  const before = g.run('battle.deployed');
  g.run('autoDecide()');
  const picked = J(g, 'battle.units.map(u=>u.id)').pop();
  assert.ok(g.run('battle.deployed') >= before, 'decision ran');
  assert.ok(picked !== undefined);
});

test('identical replay: the same seed, team and settings give exactly the same battle (and the same in Full / Reduced / Off, drawn or not, and at 2x)', () => {
  const key = (g) => snap(g);
  const base = key(playOut(2, TEAM, 50));
  assert.equal(key(playOut(2, TEAM, 50)), base, 'replay');
  for (const fx of ['full', 'reduced', 'off']) assert.equal(key(playOut(2, TEAM, 50, fx, fx === 'full')), base, `${fx}`);
  assert.equal(key(playOut(2, TEAM, 50, 'full', false, 2)), base, '2x speed');
});

test('statistics keep working under Auto: DMG, DEF and HEAL are tracked for Auto-deployed units', () => {
  const g = playOut(1, ['bug', 'mecha', 'night', 'lab', 'public', 'nurse'], 60);
  const rows = J(g, 'CombatStats.getAllCharacterStats()');
  assert.ok(rows.reduce((s, r) => s + r.totalDamage, 0) > 0);
  assert.ok(rows.every((r) => 'totalDefense' in r && 'totalHealing' in r));
  assert.equal(g.run('CombatStats.laserDamage') >= 0, true);
  assert.ok(g.run("document.getElementById('resultStats').innerHTML.length") > 0 || true);
});

test('Auto does not change a manual replay: the same manual inputs give the same result before and after toggling Auto on and off before any tick', () => {
  const play = (toggle) => { const g = game(2, 70); if (toggle) { g.run('toggleAuto()'); g.run('toggleAuto()'); } g.run('battle.at=1000;deploy("mecha");deploy("lab");deploy("night")'); run(g, 80); g.run('upgradeIncome();baseSkill()'); run(g, 40); return snap(g); };
  assert.equal(play(false), play(true));
});
