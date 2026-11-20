// Five stages: data integrity, per-stage scaling, the second boss of stage 5, loading, and that every stage can be played and finished.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, tick } = require('./harness');

const J = (g, c) => JSON.parse(g.run(`JSON.stringify(${c})`));
const game = (stage, seed = 1) => {
  const g = loadGame(seed, { lazy: true, enemies: true });
  g.run(`team=['bug','mecha','night','lab','chem','dental'];screen='battle';stage=${stage};startBattle(${seed});battle.at=1000`);
  return g;
};
const TPL = "Object.fromEntries(Object.entries(enemyTemplates()).map(([k,v])=>[k,v.id]))";

test('there are five stages with names, descriptions, rosters and bosses that all exist', () => {
  const g = loadGame(1, { lazy: true });
  assert.deepEqual(J(g, 'Object.keys(STAGES)'), ['1', '2', '3', '4', '5']);
  const tpl = J(g, TPL), ids = new Set(Object.values(tpl));
  for (let n = 1; n <= 5; n++) {
    const S = J(g, `(({name,desc,enemies,bossType,bossAt,bossType2,bossAt2,scale})=>({name,desc,enemies,bossType,bossAt,bossType2,bossAt2,scale}))(STAGES[${n}])`);
    assert.match(S.name, new RegExp(`^Stage ${n} · `), `stage ${n} name`);
    assert.ok(S.desc && S.desc.length > 10, `stage ${n} has a description`);
    for (const id of S.enemies) assert.ok(ids.has(id), `stage ${n}: ${id} is an enemy`);
    assert.ok(tpl[S.bossType] && S.enemies.includes(tpl[S.bossType]), `stage ${n}: the boss is in the roster`);
    assert.ok(S.bossAt >= 60 && S.bossAt <= 120, `stage ${n}: boss time ${S.bossAt}`);
    if (S.bossType2) assert.ok(S.enemies.includes(tpl[S.bossType2]) && S.bossAt2 > S.bossAt + 30 && S.bossAt2 < 200, 'second boss is later and in the roster');
  }
  assert.equal(g.run('STAGES[5].bossType2'), 'exammaster');
  assert.equal(g.run('STAGES[3].bossType'), 'boss');
  assert.equal(g.run('STAGES[4].bossType'), 'exammaster');
});

test('every spawn pick of every stage is an enemy of that stage roster, and each stage mixes several kinds', () => {
  const g = loadGame(1, { lazy: true });
  const tpl = J(g, TPL);
  for (let n = 1; n <= 5; n++) {
    const roster = new Set(J(g, `STAGES[${n}].enemies`)), used = new Set();
    for (let t = 0; t <= 250; t += 4) for (let r = 0; r < 1; r += 0.01) {
      const k = g.run(`STAGES[${n}].pick(${t},${r})`);
      assert.ok(tpl[k], `${n}: ${k} is a template`);
      assert.ok(roster.has(tpl[k]), `stage ${n}: ${tpl[k]} is in the roster`);
      used.add(k);
    }
    assert.ok(used.size >= 4, `stage ${n} mixes at least four kinds (${[...used].join()})`);
    for (let t = 0; t <= 200; t += 20) { const gap = g.run(`STAGES[${n}].gap(${t})`); assert.ok(gap >= 1.8 && gap <= 6, `stage ${n}: sane spawn gap ${gap}`); }
  }
});

test('stages 1 and 2 keep their original numbers; stages 3-5 scale enemies by a modest documented factor, bosses included', () => {
  const base = J(loadGame(1, { lazy: true }), "(()=>{const t=enemyTemplates();return {basic:[t.basic.hp,t.basic.atk],boss:[t.boss.hp,t.boss.atk]}})()");
  for (const n of [1, 2]) {
    const g = game(n);
    g.run("spawnEnemy('basic')");
    assert.deepEqual(J(g, 'battle.enemies.map(e=>[e.hp,e.atk])'), [base.basic], `stage ${n} unscaled`);
    assert.equal(g.run(`STAGES[${n}].scale === undefined`), true);
  }
  for (const n of [3, 4, 5]) {
    const g = game(n), sc = J(g, `STAGES[${n}].scale`);
    assert.ok(sc.hp >= 1 && sc.hp <= 1.3 && sc.atk >= 1 && sc.atk <= 1.2, `stage ${n} scale is modest`);
    g.run("spawnEnemy('basic');spawnEnemy('boss')");
    const R = (v, m) => Math.round(v * m);
    assert.deepEqual(J(g, 'battle.enemies.map(e=>[e.hp,e.maxHp,e.atk])'), [[R(base.basic[0], sc.hp), R(base.basic[0], sc.hp), R(base.basic[1], sc.atk)], [R(base.boss[0], sc.hp), R(base.boss[0], sc.hp), R(base.boss[1], sc.atk)]]);
  }
});

test('stage 5 has two bosses on their own timers (Final Exam, then Exam Master); "boss dead" only after both', () => {
  const g = game(5, 7);
  g.run('battle.enemies=[];battle.units=[];battle.t=89.9;battle.enemyTimer=999');
  tick(g, 0.3, 0.05);
  assert.equal(g.run("battle.enemies.filter(e=>e.type==='boss'&&e.id==='final').length"), 1, 'Final Exam at 90s');
  assert.equal(g.run("battle.enemies.some(e=>e.id==='exammaster')"), false, 'Exam Master is not here yet');
  g.run("damage(battle.enemies.find(e=>e.id==='final'),1e9,'x')");
  assert.equal(g.run('battle.bossDead'), false, 'one boss down, the second is still to come');
  g.run('battle.t=149.9;battle.enemyTimer=999');
  tick(g, 0.3, 0.05);
  assert.equal(g.run("battle.enemies.filter(e=>e.id==='exammaster').length"), 1, 'Exam Master at 150s');
  g.run("damage(battle.enemies.find(e=>e.id==='exammaster'),1e9,'x')");
  assert.equal(g.run('battle.bossDead'), true, 'both bosses are down');
  const s1 = game(1, 7);
  s1.run("spawnEnemy('boss');damage(battle.enemies[0],1e9,'x')");
  assert.equal(s1.run('battle.bossDead'), true, 'single-boss stages are unchanged: one kill is enough');
});

test('with both bosses alive at once, killing one is not enough', () => {
  const g = game(5, 8);
  g.run("battle.enemies=[];spawnEnemy('boss');spawnEnemy('exammaster');battle.bossSpawned=true;battle.boss2Spawned=true");
  g.run("damage(battle.enemies[0],1e9,'x')");
  assert.equal(g.run('battle.bossDead'), false);
  g.run("damage(battle.enemies.find(e=>e.alive&&e.type==='boss'),1e9,'x')");
  assert.equal(g.run('battle.bossDead'), true);
});

test('each stage requests only its own roster; stage 5 the union; repeats come from the cache', () => {
  const g = loadGame(1, { lazy: true, enemies: true });
  g.run("team=['bug','mecha','night','lab','chem','dental'];screen='battle';stage=3;startBattle(1)");
  const srcs = J(g, 'Image.all?Image.all.map(i=>i.src):[]').join('|');
  if (srcs) assert.ok(!/enemies\/(professor|advisor|exammaster)\//.test(srcs), 'stage 3 does not load staff enemies');
  const c = g.run('Image.count');
  g.run('stage=5;startBattle(2)');
  assert.ok(g.run('Image.count') > c, 'stage 5 requested what stage 3 did not');
  const c5 = g.run('Image.count');
  g.run('stage=5;startBattle(3)');
  assert.equal(g.run('Image.count'), c5, 'cached afterwards');
});

test('every stage can be played for two minutes by hand and by Auto, and ends in the right result when forced', () => {
  for (let n = 1; n <= 5; n++) {
    for (const auto of [false, true]) {
      const g = game(n, 20 + n);
      if (auto) g.run('AUTO.on=true'); else g.run('for(const id of team)deploy(id)');
      for (let i = 0; i < 2400 && !g.run('battle.ended'); i++) { g.run('update(0.05)'); if (!auto && i % 80 === 0) g.run('battle.at=1000;for(const id of team)deploy(id)'); }
      assert.ok(g.run('battle.t') > 50 || g.run('battle.ended'), `stage ${n} auto=${auto} ran`);
    }
    const w = game(n, 30 + n);
    w.run('battle.bossSpawned=true;battle.boss2Spawned=true;battle.bossDead=true;battle.enemyHp=0;update(0.05)');
    assert.equal(w.run('battle.ended'), true);
    assert.equal(w.run("document.getElementById('resultTitle').textContent"), 'ชนะแล้ว', `stage ${n} victory`);
    const l = game(n, 40 + n);
    l.run('battle.baseHp=0;update(0.05)');
    assert.equal(l.run("document.getElementById('resultTitle').textContent"), 'แพ้', `stage ${n} defeat`);
  }
});

test('AT economy, bases and the laser are identical in every stage', () => {
  const start = (n) => J(game(n, 3), '({income:battle.income,upgrade:battle.upgrade,base:battle.baseHp,enemy:battle.enemyHp,maxAt:battle.maxAt,level:battle.level,baseCd:battle.baseCd})');
  for (let n = 2; n <= 5; n++) assert.deepEqual(start(n), start(1), `stage ${n}`);
  for (let n = 1; n <= 5; n++) {
    const g = game(n, 4);
    g.run("battle.enemies=[];spawnEnemy('basic');battle.enemies[0].hp=battle.enemies[0].maxHp=1000;baseSkill()");
    assert.equal(g.run('battle.enemies[0].hp'), 500, `stage ${n}: laser 500 damage`);
    assert.equal(g.run('battle.baseCd'), 45);
  }
});
