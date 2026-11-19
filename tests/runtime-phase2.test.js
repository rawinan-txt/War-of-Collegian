// Phase 2: runtime reads anchors / feet / shadow / fallback from the generated configuration, sprites load lazily.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadGame, tick } = require('./harness');
const imp = require('../tools/import-sprite');
const pipe = require('../tools/characters');

const ROOT = path.join(__dirname, '..');
const SHIPPED = path.join(ROOT, 'public', 'assets', 'characters');
const MANIFEST = path.join(SHIPPED, 'manifest.js');
const J = (g, e) => JSON.parse(g.run(`JSON.stringify(${e})`));
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

// a manifest derived from the shipped sprites.json with a mutation applied
function manifestWith(mut) {
  const cfg = JSON.parse(fs.readFileSync(path.join(SHIPPED, 'sprites.json'), 'utf8'));
  mut(cfg.characters.bug);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p2-'));
  const file = path.join(dir, 'manifest.js');
  fs.writeFileSync(file, imp.manifestText(cfg));
  return file;
}
function battle(opts = {}) {
  const g = loadGame(opts.seed || 5, opts);
  g.run(`team=['bug','mecha','night','lab','animal','music'];startBattle();battle.at=1000;battle.income=0;deploy('bug')`);
  return g;
}

// ---------------------------------------------------------------- anchors
test('Bug Hunter: projectile spawn and muzzle flash come from the configured anchor and equal the old hard-coded position', () => {
  const g = battle({ manifest: MANIFEST });
  g.run(`globalThis.B=battle.units.find(u=>u.id==='bug');spawnEnemy('ranged');globalThis.E=battle.enemies[0];B.x=234.5;B.y=311.25;E.x=700.75;E.y=300.5;`);
  g.run(`launchProjectile(B,{target:E,val:1,a:snapAttacker(B)})`);
  const p = J(g, 'battle.projectiles[battle.projectiles.length-1]');
  assert.deepEqual([p.x, p.y], [234.5 + 18, 311.25 - 14], 'allied muzzle = (x+18, y-14)');
  g.run(`launchProjectile(E,{target:B,val:1,a:snapAttacker(E)})`);
  const q = J(g, 'battle.projectiles[battle.projectiles.length-1]');
  assert.deepEqual([q.x, q.y], [700.75 - 18, 300.5 - 14], 'enemy muzzle is mirrored and uses the default anchor');
  assert.deepEqual(J(g, 'muzzleOf(B)'), [252.5, 297.25]);
});

test('Bug Hunter: skill VFX anchor reproduces the old beam/burst coordinates exactly (for fractional positions too)', () => {
  const g = loadGame(1, { manifest: MANIFEST });
  for (const [x, y] of [[0, 0], [123.456, 327.25], [987.654, 310.5]]) {
    g.run(`globalThis.__c=[];fxBeam=function(...a){__c.push(['beam',...a])};fxBurst=function(...a){__c.push(['burst',...a])};fxShake=function(...a){__c.push(['shake',...a])};runSkillFx({id:'bug',x:${x},y:${y},ally:true})`);
    const c = J(g, '__c');
    const ly = y - 30;
    assert.equal(c.length, 3);
    near(c[0][1], x + 22, 'beam x1'); near(c[0][2], ly, 'beam y1'); near(c[0][3], x + 282, 'beam x2'); near(c[0][4], ly, 'beam y2'); assert.equal(c[0][5], '#7fe3ff');
    near(c[1][1], x + 24, 'burst x'); near(c[1][2], ly, 'burst y'); assert.deepEqual(c[1].slice(3), ['#bff3ff', 10, 3]);
    assert.deepEqual(c[2], ['shake', 2]);
  }
});

// effect data (fx.js) with the Bug Hunter skill anchor moved
function fxWithAnchor(anchor) {
  const c = {};
  new Function('globalThis', fs.readFileSync(path.join(SHIPPED, 'fx.js'), 'utf8'))(c);
  c.CHARACTER_FX.bug.anchor = anchor;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p2fx-'));
  const file = path.join(dir, 'fx.js');
  fs.writeFileSync(file, 'globalThis.CHARACTER_FX = ' + JSON.stringify(c.CHARACTER_FX) + ';');
  return file;
}

test('anchors from character.json move the projectile and the skill effect; heroes without anchors keep their defaults', () => {
  const m = manifestWith((c) => { c.anchors = { muzzle: [30, -20] }; });
  const g = loadGame(1, { manifest: m, fx: fxWithAnchor([40, -10]) });
  assert.deepEqual(J(g, "muzzleOf({id:'bug',x:500,y:300,ally:true})"), [530, 280]);
  assert.deepEqual(J(g, "muzzleOf({id:'bug',x:500,y:300,ally:false})"), [470, 280], 'mirrored for enemies');
  assert.deepEqual(J(g, "muzzleOf({id:'mecha',x:500,y:300,ally:true})"), [518, 286], 'no anchors configured: defaults');
  g.run(`globalThis.__c=[];fxBeam=function(...a){__c.push(['beam',...a])};fxBurst=function(...a){__c.push(['burst',...a])};fxShake=function(...a){__c.push(['shake',...a])};runSkillFx({id:'bug',x:100,y:300,ally:true})`);
  const c = J(g, '__c');
  assert.deepEqual(c[0].slice(1, 5), [140, 290, 400, 290], 'beam starts at the configured skill anchor');
  assert.deepEqual(c[1].slice(1, 3), [142, 290]);
  // mirrored for an enemy caster
  g.run("__c.length=0;runSkillFx({id:'bug',x:900,y:300,ally:false})");
  assert.deepEqual(J(g, '__c')[0].slice(1, 5), [860, 290, 600, 290], 'x offsets are mirrored for enemies');
});

test('feet alignment, display scale and the death shadow are taken from the generated configuration', () => {
  const m = manifestWith((c) => { c.anims.idle.feetRow = 80; c.scale = 2; c.anims.death.shadow = [[5, 20, 1], [6, 20, 1], [7, 20, 1], [8, 20, 1], [9, 20, 0.5], [10, 20, 0.1]]; });
  const g = loadGame(1, { manifest: m });
  g.run('ctx.globalAlpha=1;ctx.__calls.length=0;globalThis.R=[];ctx.ellipse=function(...a){R.push([...a,ctx.globalAlpha])};drawSpriteFrame("bug","idle",0,300,200,true)');
  const a = J(g, 'ctx.__calls.filter(c=>c.k==="drawImage")[0].args');
  assert.deepEqual([a[3], a[4], a[7], a[8]], [96, 96, 192, 192], 'scale 2 from the config');
  assert.equal(a[6], Math.round(200 + 24 - (80 + 1) * 2), 'feet row 80 sits on the ground line');
  g.run('R.length=0;drawSpriteFrame("bug","death",0.5,300,200,true)');
  const s = J(g, 'R[0]');
  assert.equal(s[0], 300 + 9, 'shadow dx from the configured table (frame 4)');
  assert.equal(s[7], 0.5, 'shadow alpha from the configured table');
});

// ---------------------------------------------------------------- fallback
const noStunWalk = (c) => { delete c.anims.stun; delete c.anims.walk; c.fallback = { stun: ['hurt', 'idle'] }; };
const src = (g, name, state) => { g.run('ctx.__calls.length=0'); g.run(`drawSpriteFrame("bug","${state}",0.1,300,200,true)`); return J(g, 'ctx.__calls.filter(c=>c.k==="drawImage")[0].args[0]._s'); };

test('explicit fallback: the configured chain is used, then idle; the game never crashes on a missing animation', () => {
  const g = loadGame(1, { manifest: manifestWith(noStunWalk) });
  assert.equal(g.run('spriteReady("bug")'), true);
  assert.match(src(g, 'bug', 'stun'), /bug\/hurt\.png/, 'stun -> hurt by configuration');
  assert.match(src(g, 'bug', 'walk'), /bug\/idle\.png/, 'walk has no chain -> idle');
  assert.match(src(g, 'bug', 'attack'), /bug\/attack\.png/, 'existing states are untouched');
  assert.match(src(g, 'bug', 'nonsense'), /bug\/idle\.png/, 'an unknown state cannot crash');
  // a full battle with the incomplete character
  g.run(`team=['bug','mecha','night','lab','animal','music'];startBattle();battle.at=1000;deploy('bug')`);
  tick(g, 10, 1 / 30);
  assert.ok(g.run('battle.t') > 9.9);
});

test('debug mode reports each fallback once; production mode stays silent', () => {
  const g = loadGame(1, { manifest: manifestWith(noStunWalk) });
  g.run('globalThis.__w=[];console={warn:(m)=>__w.push(m),log(){},error(){}}');
  src(g, 'bug', 'stun'); src(g, 'bug', 'walk');
  assert.deepEqual(J(g, '__w'), [], 'production: no warnings');
  assert.deepEqual(J(g, 'FALLBACK_LOG'), []);
  g.run('setDebug(true)');
  src(g, 'bug', 'stun'); src(g, 'bug', 'stun'); src(g, 'bug', 'walk'); src(g, 'bug', 'attack');
  const w = J(g, '__w');
  assert.equal(w.length, 2, 'once per animation: ' + w.join(' | '));
  assert.match(w[0], /bug: no usable 'stun' animation, using 'hurt'/);
  assert.match(w[1], /bug: no usable 'walk' animation, using 'idle'/);
  assert.deepEqual(J(g, 'FALLBACK_LOG'), [{ id: 'bug', state: 'stun', using: 'hurt' }, { id: 'bug', state: 'walk', using: 'idle' }]);
  // the on-screen list exists only in debug mode
  g.run(`team=['bug'];startBattle();ctx.__calls.length=0;screen='battle';draw()`);
  assert.ok(J(g, 'ctx.__calls').some((c) => c.k === 'fillText' && /fallback bug\.stun -> hurt/.test(c.args[0])));
  g.run('setDebug(false);ctx.__calls.length=0;draw()');
  assert.ok(!J(g, 'ctx.__calls').some((c) => c.k === 'fillText' && /^fallback /.test(String(c.args[0]))));
});

test('a sheet that fails to load only affects its own state; a failed idle falls back to the placeholder drawing', () => {
  let g = loadGame(1, { manifest: MANIFEST, failSheets: 'bug/walk\\.png' });
  assert.equal(g.run('spriteReady("bug")'), true, 'one failed optional sheet does not drop the character');
  g.run('setDebug(true);globalThis.__w=[];console={warn:(m)=>__w.push(m)}');
  assert.match(src(g, 'bug', 'walk'), /bug\/idle\.png/);
  assert.match(J(g, '__w')[0], /walk/);
  g = loadGame(1, { manifest: MANIFEST, failSheets: 'bug/idle\\.png' });
  assert.equal(g.run('spriteReady("bug")'), false);
  g.run(`team=['bug','mecha','night','lab','animal','music'];startBattle();battle.at=1000;deploy('bug')`);
  tick(g, 5, 1 / 30);
  g.run('ctx.__calls.length=0;draw()');
  assert.ok(g.run('battle.t') > 4.9, 'the battle runs with the placeholder');
});

test('asset check reports states without a sheet: warning without an explicit chain, info with one', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p2fb-'));
  fs.cpSync(path.join(SHIPPED, 'bug'), path.join(root, 'bug'), { recursive: true });
  fs.copyFileSync(path.join(SHIPPED, 'sprites.json'), path.join(root, 'sprites.json'));
  fs.copyFileSync(MANIFEST, path.join(root, 'manifest.js'));
  const d = JSON.parse(fs.readFileSync(path.join(root, 'bug', 'character.json'), 'utf8'));
  delete d.anims.walk; delete d.anims.stun; d.fallback = { stun: ['hurt', 'idle'] };
  fs.writeFileSync(path.join(root, 'bug', 'character.json'), JSON.stringify(d));
  const res = pipe.check(root, { only: 'bug', smoke: false });
  assert.ok(res.warnings.some((w) => /bug: walk: no sheet and no explicit fallback/.test(w)), res.warnings.join('|'));
  assert.ok(res.info.some((i) => /bug: stun: no sheet; falls back along hurt > idle/.test(i)));
  assert.ok(!res.warnings.some((w) => /stun/.test(w)));
});

// ---------------------------------------------------------------- lazy loading
const loadedIds = (g) => J(g, 'Object.keys(SPRITES).sort()');
const sheetsOf = (g, ids) => J(g, `[...${JSON.stringify(ids)}].flatMap(id=>Object.values(CHARACTER_ANIMS[id].anims).map(a=>a.sheet))`);

test('lazy loading: nothing is requested at page load; the team screen loads exactly the default team (and the summon)', () => {
  const g = loadGame(1, { manifest: MANIFEST, lazy: true });
  assert.equal(g.run('Image.count||0'), 0, 'no image requested at startup');
  g.run('show("team")');
  assert.deepEqual(loadedIds(g), ['animal', 'bug', 'dog', 'lab', 'mecha', 'music', 'night']);
  const want = sheetsOf(g, ['animal', 'bug', 'dog', 'lab', 'mecha', 'music', 'night']);
  assert.deepEqual(J(g, 'Image.requested').sort(), want.sort());
  for (const id of ['chem', 'dental', 'runner', 'global', 'public', 'nurse']) assert.ok(!(id in J(g, 'SPRITES')), id + ' not loaded');
});

test('lazy loading: picking another hero loads it once, un-picking does not reload anything, a battle reuses the cache', () => {
  const g = loadGame(1, { manifest: MANIFEST, lazy: true });
  g.run('show("team")');
  const n0 = g.run('Image.count');
  g.run('toggleHero("music");toggleHero("nurse")');
  assert.ok(loadedIds(g).includes('nurse'));
  const n1 = g.run('Image.count');
  assert.equal(n1 - n0, g.run('Object.keys(CHARACTER_ANIMS.nurse.anims).length'), 'only the new hero was requested');
  g.run('toggleHero("nurse");toggleHero("nurse")');
  assert.equal(g.run('Image.count'), n1, 're-picking a loaded hero requests nothing');
  g.run('startBattle()');
  assert.equal(g.run('Image.count'), n1, 'starting a battle with loaded heroes requests nothing');
  g.run('startBattle()');
  assert.equal(g.run('Image.count'), n1, 'a second battle too (cache)');
  assert.deepEqual(J(g, 'ENEMY_SPRITE_IDS'), ['assignment', 'deadline', 'group', 'quiz', 'final'], 'enemy sprite ids known for the stage (none have sprites yet)');
  assert.ok(!loadedIds(g).some((i) => ENEMY.includes(i)));
});
const ENEMY = ['assignment', 'deadline', 'group', 'quiz', 'final'];

test('lazy loading never blocks a battle: it runs on placeholders while images load, then switches to sprites', () => {
  const g = loadGame(7, { manifest: MANIFEST, lazy: true, holdImages: true });
  g.run(`team=['bug','mecha','night','lab','animal','music'];startBattle();battle.at=1000;battle.income=0;for(const id of team)deploy(id)`);
  assert.equal(g.run('spriteReady("bug")'), false, 'still loading');
  tick(g, 6, 1 / 30);
  assert.ok(g.run('battle.t') > 5.9, 'the battle progressed while nothing was loaded');
  g.run('ctx.__calls.length=0;draw()');
  assert.equal(J(g, 'ctx.__calls.filter(c=>c.k==="drawImage").length'), 0, 'placeholder drawing meanwhile');
  g.run('Image.flush()');
  assert.equal(g.run('spriteReady("bug")'), true);
  g.run('ctx.__calls.length=0;draw()');
  assert.ok(J(g, 'ctx.__calls.filter(c=>c.k==="drawImage").length') >= 1, 'sprites once loaded');
});

test('lazy and eager loading give identical battles; pause/resume and 2x speed are unaffected', () => {
  const run = (opts, speed) => {
    const g = loadGame(11, { manifest: MANIFEST, ...opts });
    g.run(`team=['bug','mecha','night','lab','chem','dental'];startBattle();battle.at=1000;battle.income=0;battle.speed=${speed};for(const id of team)deploy(id)`);
    for (let i = 0; i < 40 * 30; i++) {
      g.run('update(1/30)');
      if (i === 200) g.run('battle.paused=true');
      if (i === 230) g.run('battle.paused=false');
    }
    return g.run('JSON.stringify({t:battle.t,kills:battle.kills,base:battle.baseHp,enemy:battle.enemyHp,stats:CombatStats.getAllCharacterStats(),units:battle.units.map(u=>[u.id,u.hp,u.x,u.animName])})');
  };
  for (const speed of [1, 2]) assert.equal(run({}, speed), run({ lazy: true }, speed), `speed ${speed}`);
});
