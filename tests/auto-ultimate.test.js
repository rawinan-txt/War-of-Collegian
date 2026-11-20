// Auto Ultimate: Auto Play fires the ultimate the player picked, with the same action and rules as a human, on deterministic rules.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, tick } = require('./harness');

const J = (g, c) => JSON.parse(g.run(`JSON.stringify(${c})`));
const TEAM = ['bug', 'mecha', 'night', 'lab', 'chem', 'dental'];
function game(stage = 1, seed = 1, ult = 'wifi') {
  const g = loadGame(seed, { lazy: true, enemies: true });
  g.run(`team=${JSON.stringify(TEAM)};screen='battle';stage=${stage};ultType='${ult}';startBattle(${seed});battle.at=0;battle.income=0;AUTO.on=true;AUTO.laser=false;AUTO.upgrade=false`);
  return g;
}
// enemies at the given x positions, with the given hp
const foes = (g, xs, hp = 1000, id = 'basic') => g.run(`battle.enemies=[];battle.units=[];${JSON.stringify(xs)}.forEach(x=>{spawnEnemy('${id}');const e=battle.enemies[battle.enemies.length-1];e.x=x;e.hp=e.maxHp=${hp}})`);
const fires = (g) => { g.run('battle.ult=100;battle.ultFires=0;autoDecide()'); return g.run('battle.ultFires||0') === 1 && g.run('battle.ult') === 0; };

test('every ultimate that exists has an auto rule (a future ultimate must add one or it stays manual)', () => {
  const g = loadGame(1, { lazy: true });
  assert.deepEqual(J(g, 'Object.keys(ULTIMATES)').sort(), ['rain', 'shuttle', 'wifi']);
  assert.deepEqual(J(g, 'Object.keys(AUTO_ULT_RULES)').sort(), J(g, 'Object.keys(ULTIMATES)').sort());
  const h = game(1, 1, 'wifi');
  h.run("ULTIMATES.future={name:'x',desc:'x'};ultType='future'");
  foes(h, [140, 150]);
  assert.equal(fires(h), false, 'an ultimate without a rule is never fired automatically');
});

test('Auto uses the existing action: the meter is reset by useUltimate, and nothing fires with a meter below 100, no enemies, or the option off', () => {
  for (const ult of ['wifi', 'rain', 'shuttle']) {
    const g = game(1, 2, ult);
    foes(g, [140, 150, 160, 170]);
    g.run('battle.ult=99;autoDecide()');
    assert.equal(g.run('battle.ult'), 99, `${ult}: meter below 100`);
    g.run('battle.ult=100;AUTO.ult=false;autoDecide()');
    assert.equal(g.run('battle.ult'), 100, `${ult}: option off`);
    g.run('AUTO.ult=true;battle.enemies=[];autoDecide()');
    assert.equal(g.run('battle.ult'), 100, `${ult}: no enemies`);
    foes(g, [140, 150, 160, 170]);
    assert.equal(fires(g), true, `${ult}: fires when the base is in danger with a group`);
  }
});

test('Wi-Fi Down (control): fires for danger at the base, a threat with 2+ enemies, or a hurt frontline under pressure; not for a lone distant enemy', () => {
  const g = game(1, 3, 'wifi');
  foes(g, [800]); assert.equal(fires(g), false, 'one far enemy');
  foes(g, [700, 720, 740]); assert.equal(fires(g), false, 'a group far away');
  foes(g, [150]); assert.equal(fires(g), true, 'danger: one enemy at the base');
  foes(g, [250, 600]); assert.equal(fires(g), true, 'threat with two enemies');
  foes(g, [350]); assert.equal(fires(g), false, 'a single enemy that is only a threat (not yet danger)');
  g.run("battle.enemies=[];spawnEnemy('boss');battle.enemies[0].x=700;battle.units=[makeUnit(heroes.find(h=>h.id==='mecha'),true,650)];battle.units[0].hp=battle.units[0].maxHp*0.5");
  assert.equal(fires(g), true, 'a boss in a fight with a hurt ally');
  foes(g, [380, 400, 420]);
  g.run("battle.units=[makeUnit(heroes.find(h=>h.id==='mecha'),true,300)];battle.units[0].hp=battle.units[0].maxHp*0.3");
  assert.equal(fires(g), true, 'hurt frontline with 3 enemies close');
  // the effect is the existing one
  foes(g, [150, 160]); g.run('battle.ult=100;autoDecide()');
  assert.deepEqual(J(g, 'battle.enemies.map(e=>e.stun)'), [3, 3]);
});

test('Salaya Rain (slow): fires for 4+ approaching enemies, a threat, or a boss coming; not for a couple of distant ones', () => {
  const g = game(1, 4, 'rain');
  foes(g, [700, 750]); assert.equal(fires(g), false, 'two enemies far away');
  foes(g, [500, 520, 540, 560]); assert.equal(fires(g), true, 'four approaching');
  foes(g, [900, 920, 940, 960]); assert.equal(fires(g), false, 'four but still far from the base');
  foes(g, [250, 300]); assert.equal(fires(g), true, 'threat with two');
  g.run("battle.enemies=[];spawnEnemy('boss');battle.enemies[0].x=550");
  assert.equal(fires(g), true, 'a boss on its way');
  g.run('battle.ult=100;autoDecide()');
  assert.ok(g.run('battle.rain') > 11, 'the existing 12 s slow');
});

test('Campus Shuttle (damage): fires for a worthwhile group, 3+ kills, a boss with company, or danger; not for one healthy enemy', () => {
  const g = game(1, 5, 'shuttle');
  foes(g, [600]); assert.equal(fires(g), false, 'one healthy enemy');
  foes(g, [600, 620], 1000); assert.equal(fires(g), false, 'two healthy enemies are worth 600');
  foes(g, [600, 620, 640], 1000); assert.equal(fires(g), true, 'three healthy enemies: 900 damage');
  foes(g, [600, 620, 640], 200); assert.equal(fires(g), true, 'three weak enemies: three kills');
  foes(g, [600, 620], 200); assert.equal(fires(g), false, 'two weak enemies: only 400 value');
  foes(g, [150], 1000); assert.equal(fires(g), true, 'danger: an enemy at the base');
  g.run("battle.enemies=[];spawnEnemy('boss');spawnEnemy('basic');battle.enemies[0].x=600;battle.enemies[1].x=640");
  assert.equal(fires(g), true, 'boss plus company');
  g.run('battle.ult=100;autoDecide()');
  assert.ok(g.run('!!battle.shuttle'), 'the shuttle runs');
});

test('a full meter that has been held for 25 s is released with a lower bar (it gains nothing while full)', () => {
  const g = game(1, 6, 'rain');
  foes(g, [600, 620, 640]);
  g.run('battle.ult=100;battle.autoUltT=0');
  assert.equal(fires(g), false, 'three enemies at mid distance: not yet');
  g.run('battle.ult=100;battle.autoUltT=26');
  assert.equal(fires(g), true, 'after holding it for 25 s');
});

test('Auto ultimate and manual ultimate coexist: the player can still fire it himself, and Auto then waits for the meter to refill', () => {
  const g = game(1, 7, 'wifi');
  foes(g, [800]);
  g.run('battle.ult=100');
  assert.equal(g.run('useUltimate()'), true, 'manual use while Auto is on');
  assert.equal(g.run('battle.ult'), 0);
  foes(g, [150, 160]);
  g.run('autoDecide()');
  assert.equal(g.run('battle.ultFires'), 1, 'Auto did not fire an empty meter');
  g.run('AUTO.on=false;battle.ult=100');
  tick(g, 1, 0.05);
  assert.equal(g.run('battle.ult'), 100, 'Auto off: update() never decides anything');
});

test('no ultimate while paused or after the battle ended; update() with Auto off never fires one', () => {
  const g = game(1, 8, 'wifi');
  foes(g, [150, 160]);
  g.run('battle.ult=100;battle.paused=true');
  tick(g, 2, 0.05);
  assert.equal(g.run('battle.ult'), 100, 'paused');
  g.run('battle.paused=false;AUTO.on=false');
  tick(g, 1, 0.05);
  assert.equal(g.run('battle.ult'), 100, 'Auto off: the player decides');
  g.run('AUTO.on=true;battle.ended=true');
  tick(g, 1, 0.05);
  assert.equal(g.run('battle.ult'), 100, 'after Victory / Defeat');
});

test('decisions never touch the random streams, and the replay is exact for every ultimate (Full / Reduced / Off, drawn or not, 2x)', () => {
  const g = game(1, 9, 'shuttle');
  foes(g, [140, 150, 600]);
  const d0 = J(g, '[battle.rng.combat.draws,battle.rng.vfx.draws,battle.rng.combat.state,battle.rng.vfx.state]');
  for (let i = 0; i < 40; i++) g.run('{const S=autoState();autoWantsUlt(S)}');
  assert.deepEqual(J(g, '[battle.rng.combat.draws,battle.rng.vfx.draws,battle.rng.combat.state,battle.rng.vfx.state]'), d0);
  const snap = (x) => x.run('JSON.stringify({t:Math.round(battle.t*1000),base:battle.baseHp,enemy:battle.enemyHp,kills:battle.kills,ult:battle.ult,fires:battle.ultFires||0,at:Math.round(battle.at),units:battle.units.map(u=>[u.id,Math.round(u.x*100),Math.round(u.hp*100)]),enemies:battle.enemies.map(u=>[u.id,Math.round(u.x*100),Math.round(u.hp*100)]),cs:battle.rng.combat.state,stats:CombatStats.getAllCharacterStats(),ud:Math.round(CombatStats.ultDamage)})');
  for (const ult of ['wifi', 'rain', 'shuttle']) {
    const play = (fx, draw, speed) => {
      const h = loadGame(11, { lazy: true, enemies: true });
      h.run(`team=${JSON.stringify(TEAM)};screen='battle';stage=2;ultType='${ult}';startBattle(11);setFxLevel('${fx}');AUTO.on=true;battle.speed=${speed}`);
      const step = 0.05 / speed;
      for (let i = 0; i < 4000 && !h.run('battle.ended'); i++) { h.run(`update(${step})`); if (draw && i % 3 === 0) h.run('draw()'); }
      return snap(h);
    };
    const base = play('full', false, 1);
    assert.equal(play('full', false, 1), base, `${ult}: replay`);
    for (const fx of ['reduced', 'off']) assert.equal(play(fx, fx === 'reduced', 1), base, `${ult}: ${fx}`);
    assert.equal(play('full', false, 2), base, `${ult}: 2x speed`);
    assert.ok(JSON.parse(base).fires >= 1, `${ult}: Auto fired it in a real battle`);
  }
});

test('every ultimate works under Auto on every stage: fired at least once, no errors, battle ends cleanly, DMG / DEF / HEAL rows intact', () => {
  for (const ult of ['wifi', 'rain', 'shuttle']) for (let stage = 1; stage <= 5; stage++) {
    const g = loadGame(20 + stage, { lazy: true, enemies: true });
    g.run(`team=${JSON.stringify(TEAM)};screen='battle';stage=${stage};ultType='${ult}';startBattle(${20 + stage});AUTO.on=true`);
    for (let i = 0; i < 7000 && !g.run('battle.ended'); i++) g.run('update(0.05)');
    assert.equal(g.run('battle.ended'), true, `${ult} stage ${stage} ended`);
    assert.ok(g.run('battle.ultFires||0') >= 1, `${ult} stage ${stage}: Auto used the ultimate`);
    const rows = J(g, 'CombatStats.getAllCharacterStats()');
    assert.ok(rows.length === 6 && rows.every((r) => 'totalDamage' in r && 'totalDefense' in r && 'totalHealing' in r));
    assert.ok(!rows.some((r) => /ult|auto/i.test(r.characterId)), 'no damage is attributed to the ultimate or to Auto');
    if (ult === 'shuttle') assert.ok(g.run('CombatStats.ultDamage') > 0, 'shuttle damage is tracked as ultimate damage');
  }
});

test('Auto off: battles are identical whether the ultimate option is on or off, and a manual ultimate works as before', () => {
  const play = (opt) => {
    const g = loadGame(31, { lazy: true, enemies: true });
    g.run(`team=${JSON.stringify(TEAM)};screen='battle';stage=2;ultType='rain';startBattle(31);AUTO.ult=${opt};battle.at=1000;for(const id of team)deploy(id)`);
    for (let i = 0; i < 1200; i++) { g.run('update(0.05)'); if (i === 800) g.run('battle.ult=100;useUltimate()'); }
    return g.run('JSON.stringify([battle.t,battle.baseHp,battle.enemyHp,battle.kills,battle.units.map(u=>Math.round(u.hp)),battle.ultFires])');
  };
  assert.equal(play(true), play(false));
  assert.equal(JSON.parse(play(true))[5], 1);
});

test('HUD: the Ultimate chip exists, toggles, shows with the other chips only while Auto is on', () => {
  const g = loadGame(1, { lazy: true });
  g.run("globalThis.__cl={};{const e=document.getElementById('autoUltBtn');e.classList.toggle=(n,f)=>{__cl[n]=f}}");
  g.run("team=['bug','mecha','night','lab','chem','dental'];startBattle(1);setAutoOpt('ult')");
  assert.equal(g.run('AUTO.ult'), false);
  assert.equal(J(g, '__cl').on, false);
  g.run("setAutoOpt('ult')");
  assert.equal(g.run('AUTO.ult'), true);
  assert.equal(J(g, '__cl').on, true);
});
