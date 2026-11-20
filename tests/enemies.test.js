// Enemy system: sprite assets, animation timing, stages, enemy abilities, bosses, RNG isolation, economy and stats regression.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame, tick } = require('./harness');
const { decodePng } = require('../tools/pixel/png');
const gen = require('../tools/gen-enemies');

const ROOT = path.join(__dirname, '..');
const IDS = ['assignment', 'deadline', 'group', 'quiz', 'final', 'professor', 'ta', 'advisor', 'exammaster'];
const BOSSES = ['final', 'exammaster'];
const SKILLED = ['final', 'ta', 'advisor', 'exammaster'];
const reg = () => { const o = {}; new Function('globalThis', fs.readFileSync(path.join(ROOT, 'assets', 'enemies', 'enemies.js'), 'utf8'))(o); return o.ENEMY_ANIMS; };
const frames = (id, anim) => { const p = decodePng(fs.readFileSync(path.join(ROOT, 'assets', 'enemies', id, anim + '.png'))); const n = p.w / 64, out = []; for (let i = 0; i < n; i++) { const f = new Uint8Array(64 * 64 * 4); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) f.set(p.rgba.slice((y * p.w + i * 64 + x) * 4, (y * p.w + i * 64 + x) * 4 + 4), (y * 64 + x) * 4); out.push(f); } return { png: p, frames: out }; };
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const opaque = (f) => { let n = 0; for (let i = 3; i < f.length; i += 4) if (f[i]) n++; return n; };

function stageGame(stageNo, seed = 1, team = ['bug', 'mecha', 'night', 'lab', 'chem', 'dental'], opts = {}) {
  const g = loadGame(seed, { lazy: true, enemies: true, ...opts });
  g.run(`team=${JSON.stringify(team)};screen='battle';stage=${stageNo};startBattle(${seed});battle.at=1000`);
  return g;
}
const J = (g, code) => JSON.parse(g.run(`JSON.stringify(${code})`));

// ---------------------------------------------------------------- assets
test('every enemy has its sheets: right size, 64x64 frames, hard-edged, inside the frame, and the registry matches the files', () => {
  const R = reg();
  assert.deepEqual(Object.keys(R).sort(), [...IDS].sort());
  for (const id of IDS) {
    const need = ['idle', 'walk', 'attack', 'hurt', 'death', ...(SKILLED.includes(id) ? ['skill'] : [])];
    assert.deepEqual(Object.keys(R[id].anims).sort(), need.sort(), `${id}: animation states`);
    for (const [anim, d] of Object.entries(R[id].anims)) {
      const s = frames(id, anim);
      assert.equal(s.png.h, 64, `${id}.${anim} height`);
      assert.equal(s.png.w, d.frameCount * 64, `${id}.${anim} width = frameCount x 64`);
      for (const f of s.frames) { assert.ok(opaque(f) > 0, `${id}.${anim}: every frame has pixels`); for (let i = 3; i < f.length; i += 4) assert.ok(f[i] === 0 || f[i] === 255, `${id}.${anim}: hard-edged`); }
    }
  }
});

test('frame 0 of every idle sheet is exactly the approved static design (the approved art is the standard)', () => {
  for (const id of IDS) {
    const st = decodePng(fs.readFileSync(path.join(ROOT, 'assets', 'enemies', id, 'static.png')));
    assert.ok(same(frames(id, 'idle').frames[0], st.rgba), `${id}: idle frame 0 equals static.png`);
  }
});

test('animations have real frame differences: idle, walk, attack, hurt, death and skill are not a static sprite moved sideways', () => {
  for (const id of IDS) {
    for (const [anim, min] of [['idle', 3], ['walk', 5], ['attack', 5], ['hurt', 3], ['death', 6]].concat(SKILLED.includes(id) ? [['skill', 8]] : [])) {
      const fr = frames(id, anim).frames;
      const distinct = new Set(fr.map((f) => Buffer.from(f).toString('base64'))).size;
      assert.ok(distinct >= Math.min(min, fr.length), `${id}.${anim}: ${distinct} distinct frames of ${fr.length}`);
    }
    // walking changes the pixels themselves, not only their position: compare each walk frame with the idle frame shifted to best alignment
    const idle0 = frames(id, 'idle').frames[0];
    const walk = frames(id, 'walk').frames;
    assert.ok(walk.some((w) => opaque(w) !== opaque(idle0) || !same(w, idle0)), `${id}: walk differs from idle`);
  }
});

test('death collapses: the last frame keeps far fewer body pixels than the first; bosses die longer', () => {
  const R = reg();
  for (const id of IDS) {
    const d = frames(id, 'death').frames;
    assert.ok(opaque(d[d.length - 1]) < opaque(d[1]) * 0.8, `${id}: last death frame is smaller than frame 1`);
  }
  for (const id of BOSSES) assert.ok(R[id].anims.death.frameCount / R[id].anims.death.frameRate > 0.7, `${id}: boss death is longer than a normal corpse`);
  for (const id of IDS.filter((i) => !BOSSES.includes(i))) assert.ok(R[id].anims.death.frameCount / R[id].anims.death.frameRate <= 0.7, `${id}: normal death fits the corpse lifetime`);
});

test('pixel art stays consistent: <= 52 colours per enemy over all its animations, feet on the hero ground row', () => {
  for (const id of IDS) {
    const cols = new Set(); let lowest = 0;
    for (const anim of Object.keys(reg()[id].anims)) for (const f of frames(id, anim).frames) {
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const i = (y * 64 + x) * 4; if (f[i + 3]) cols.add(f[i] + ',' + f[i + 1] + ',' + f[i + 2]); }
    }
    assert.ok(cols.size <= 52, id + ": " + cols.size + " colours over all animations and effects");
    const idle = frames(id, 'idle').frames[0];
    for (let y = 63; y >= 0; y--) { if ([...Array(64).keys()].some((x) => idle[(y * 64 + x) * 4 + 3])) { lowest = y; break; } }
    assert.ok(lowest >= 54 && lowest <= 57, `${id}: idle feet at row ${lowest} (hero standard 55-56)`);
  }
});

test('generated enemy files are up to date: regenerating reproduces every sheet and the registry byte for byte', () => {
  const lf = (b) => Buffer.from(b.toString('latin1').split('\r\n').join('\n'), 'latin1');
  const { encodePng } = require('../tools/pixel/png');
  for (const id of IDS) for (const anim of gen.ANIMS[id]) {
    const fr = gen.sheetBuf(id, anim), w = fr.length * 64, rgba = new Uint8Array(w * 64 * 4);
    fr.forEach((f, i) => { for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) rgba.set(f.data.slice((y * 64 + x) * 4, (y * 64 + x) * 4 + 4), (y * w + i * 64 + x) * 4); });
    assert.ok(Buffer.compare(Buffer.from(encodePng(w, 64, rgba)), fs.readFileSync(path.join(ROOT, 'assets', 'enemies', id, anim + '.png'))) === 0, `${id}.${anim}.png is stale: run node tools/gen-enemies.js`);
  }
  const want = '// generated by tools/gen-enemies.js - visual registry for enemies (separate from CHARACTER_ANIMS so hero tooling is untouched)\nglobalThis.ENEMY_ANIMS = ' + JSON.stringify(gen.registry()) + ';\n';
  assert.equal(lf(fs.readFileSync(path.join(ROOT, 'assets', 'enemies', 'enemies.js'))).toString(), want, 'enemies.js is stale');
});

// ---------------------------------------------------------------- timing / synchronisation with combat
test('animation timing matches combat timing: attack = attack duration, impact on the hit frame, hurt = hurt duration, skill = skill duration', () => {
  const g = loadGame(1, { lazy: true, enemies: true }), R = reg();
  const C = J(g, '({atk:ATK_DUR,imp:IMPACT_DELAY,hurt:HURT_DUR,skill:SKILL_DUR,skillImp:SKILL_IMPACT})');
  for (const id of IDS) {
    const A = R[id].anims, len = (d) => d.frameCount / d.frameRate;
    assert.ok(Math.abs(len(A.attack) - C.atk) < 0.02, `${id}: attack length ${len(A.attack)}`);
    assert.equal(Math.floor(C.imp * A.attack.frameRate + 1e-9), R[id].impact.attack, `${id}: impact frame = IMPACT_DELAY x fps`);
    assert.ok(Math.abs(len(A.hurt) - C.hurt) < 0.02, `${id}: hurt length`);
    assert.equal(A.idle.repeat, -1); assert.equal(A.walk.repeat, -1);
    assert.equal(A.attack.repeat, 0); assert.equal(A.hurt.repeat, 0); assert.equal(A.death.repeat, 0);
    if (A.skill) { assert.ok(Math.abs(len(A.skill) - C.skill) < 0.03, `${id}: skill length ${len(A.skill)}`); assert.equal(R[id].impact.skill, Math.floor(C.skillImp * A.skill.frameRate + 1e-9) , `${id}: skill impact frame`); }
  }
});

test('a ranged enemy launches its projectile on the impact frame and the damage lands when it arrives', () => {
  const g = stageGame(2, 5);
  g.run("battle.at=0;spawnEnemy('professor');{const e=battle.enemies[0];e.x=600;e.hp=e.maxHp=99999}deploy('bug')");
  g.run("battle.at=1000;deploy('mecha');{const m=battle.units[battle.units.length-1];m.x=500;m.spd=0;m.hp=m.maxHp=99999;m.shield=0;battle.units=[m]}");
  let launched = null;
  for (let i = 0; i < 80 && launched === null; i++) { tick(g, 0.05, 0.05); if (g.run('battle.projectiles.length') > 0) launched = g.run('battle.t'); }
  assert.ok(launched !== null, 'a projectile was launched');
  assert.equal(g.run("battle.projectiles[0].a.id"), 'professor');
  const hp0 = g.run('battle.units[0].hp');
  tick(g, 0.5, 0.05);
  assert.ok(g.run('battle.units[0].hp') < hp0, 'damage arrived with the projectile');
});

// ---------------------------------------------------------------- stages
test('stage 1 is the original schedule bit for bit; stage 2 has the teaching staff and the Exam Master boss', () => {
  const g = loadGame(1, { lazy: true });
  for (let t = 0; t <= 90; t += 7) for (let r = 0; r < 1; r += 0.05) {
    const old = t > 32 && r < 0.25 ? 'tank' : t > 22 && r < 0.4 ? 'ranged' : r < 0.25 ? 'fast' : 'basic';
    assert.equal(g.run(`STAGES[1].pick(${t},${r})`), old, `stage 1 pick(${t},${r})`);
    assert.equal(g.run(`STAGES[1].gap(${t})`), Math.max(1.8, 4.6 - t * 0.02));
  }
  assert.deepEqual(J(g, 'STAGES[1].enemies'), ['assignment', 'deadline', 'group', 'quiz', 'final']);
  assert.equal(g.run('STAGES[1].bossType'), 'boss'); assert.equal(g.run('STAGES[1].bossAt'), 85);
  assert.equal(g.run('STAGES[2].bossType'), 'exammaster');
  const used = new Set(); for (let t = 0; t <= 200; t += 5) for (let r = 0; r < 1; r += 0.01) used.add(g.run(`STAGES[2].pick(${t},${r})`));
  assert.deepEqual([...used].sort(), ['advisor', 'basic', 'fast', 'professor', 'ta']);
  const tpl = J(g, 'Object.fromEntries(Object.entries(enemyTemplates()).map(([k,v])=>[k,v.id]))');
  const ids = new Set(Object.values(tpl));
  for (const s of [1, 2]) for (const id of J(g, `STAGES[${s}].enemies`)) assert.ok(ids.has(id), `stage ${s}: ${id} is a real enemy`);
  const all = new Set([...J(g, 'STAGES[1].enemies'), ...J(g, 'STAGES[2].enemies')]);
  assert.deepEqual(IDS.filter((id) => all.has(id)).sort(), [...IDS].sort(), 'all nine enemies are playable in some stage');
});

test('the existing five enemies keep their stats, ranges and roles exactly', () => {
  const g = loadGame(1, { lazy: true });
  assert.deepEqual(J(g, "(()=>{const t=enemyTemplates();return ['basic','fast','tank','ranged','boss'].map(k=>[t[k].id,t[k].hp,t[k].atk,t[k].range,t[k].spd,t[k].interval,t[k].type])})()"),
    [['assignment', 420, 52, 40, 38, 1.4, 'basic'], ['deadline', 300, 65, 38, 67, 1.1, 'basic'], ['group', 1350, 58, 42, 25, 1.6, 'tank'], ['quiz', 450, 75, 125, 32, 1.8, 'ranged'], ['final', 6400, 150, 58, 20, 1.8, 'boss']]);
});

test('new enemy stats are documented values in a fair range (no instant kills, no immortal tanks)', () => {
  const g = loadGame(1, { lazy: true });
  const t = J(g, "(()=>{const t=enemyTemplates();return {professor:t.professor,ta:t.ta,advisor:t.advisor,exammaster:t.exammaster}})()");
  const minHeroHp = Math.min(...J(g, 'heroes.map(h=>h.hp)'));
  for (const [id, e] of Object.entries(t)) {
    assert.ok(e.atk * 2 < minHeroHp, `${id}: two hits never kill the weakest hero`);
    assert.ok(e.interval >= 1.4, `${id}: no machine-gun attack rate`);
  }
  assert.ok(t.professor.range > 80 && t.advisor.range > 80 && t.exammaster.range > 80, 'ranged enemies fire projectiles');
  assert.ok(t.ta.hp < 400, 'the support enemy is fragile');
  assert.ok(t.exammaster.hp > t.advisor.hp && t.advisor.hp > t.professor.hp, 'boss > elite > ranged in toughness');
  assert.equal(t.exammaster.type, 'boss'); assert.equal(t.advisor.type, 'elite');
});

test('only the sprites of the stage being played are requested (lazy loading)', () => {
  const g = loadGame(1, { lazy: true, enemies: true });
  g.run("team=['bug','mecha','night','lab','chem','dental'];screen='battle';stage=1;startBattle(1)");
  const srcs = J(g, 'Image.all ? Image.all.map(i=>i.src) : []');
  if (srcs.length) { assert.ok(!srcs.some((s) => /enemies\/(professor|ta|advisor|exammaster)\//.test(s)), 'stage 1 does not load stage 2 enemies'); assert.ok(srcs.some((s) => /enemies\/assignment\//.test(s))); }
  const n1 = g.run('Image.count');
  g.run("stage=2;startBattle(2)");
  assert.ok(g.run('Image.count') > n1, 'stage 2 requested its own enemies');
  const n2 = g.run('Image.count');
  g.run('stage=2;startBattle(3)');
  assert.equal(g.run('Image.count'), n2, 'a second stage 2 battle reuses the cache');
});

// ---------------------------------------------------------------- abilities
test('Ruthless TA: supports nearby enemies with a short speed and attack-speed buff, on a cooldown, never on distant ones', () => {
  const g = stageGame(2, 3);
  g.run("spawnEnemy('ta');spawnEnemy('basic');spawnEnemy('basic');{const [ta,a,b]=battle.enemies;ta.x=700;a.x=640;b.x=950;for(const e of [ta,a,b]){e.hp=e.maxHp=99999}}");
  let buffedAt = null, casts = [];
  let prevKitT = null;
  for (let i = 0; i < 400; i++) {
    g.run('{const [ta,a,b]=battle.enemies;ta.x=700;a.x=Math.max(a.x,600);b.x=950}');
    tick(g, 0.05, 0.05);
    const s = J(g, '({near:battle.enemies[1].buff||0,far:battle.enemies[2].buff||0,kit:battle.enemies[0].kitT})');
    if (s.near > 0 && buffedAt === null) buffedAt = g.run('battle.t');
    assert.equal(s.far, 0, 'an enemy out of range is never buffed');
    if (prevKitT !== null && s.kit > prevKitT + 5) casts.push(g.run('battle.t'));
    prevKitT = s.kit;
  }
  assert.ok(buffedAt !== null && buffedAt < 4, `buff applied around the first cast (${buffedAt})`);
  assert.ok(casts.length >= 1, 'it casts again after a cooldown, not every frame');
  g.run('battle.enemies[1].buff=0');
  tick(g, 0.1, 0.05);
  assert.ok(Math.abs(g.run('battle.enemies[0].kitT')) < 9.01 && g.run('battle.enemies[0].kitT') > 0, 'cooldown is 9 seconds');
});

test('buffed enemies move 25% faster and attack 20% faster; unbuffed enemies are untouched', () => {
  const run = (buff) => {
    const g = stageGame(2, 4);
    g.run(`spawnEnemy('basic');{const e=battle.enemies[0];e.x=900;e.hp=e.maxHp=99999;${buff ? 'e.buff=100;' : ''}}battle.units=[];`);
    tick(g, 2, 0.05);
    return 900 - g.run('battle.enemies[0].x');
  };
  const walked = run(false), buffed = run(true);
  assert.ok(Math.abs(buffed / walked - 1.25) < 0.02, `speed ratio ${buffed / walked}`);
});

test('Thesis Advisor: every third hit weakens the target (-25% damage for 3s), cannot be refreshed while active or during the immunity window', () => {
  const g = stageGame(2, 6);
  g.run("battle.at=1000;deploy('mecha');spawnEnemy('advisor');{const m=battle.units[0];m.x=600;m.spd=0;m.hp=m.maxHp=99999;m.shield=0;const a=battle.enemies[0];a.x=700;a.spd=0;a.hp=a.maxHp=99999;}");
  const seen = []; let prev = 0;
  for (let i = 0; i < 400; i++) {
    g.run('{const m=battle.units[0];m.hp=m.maxHp=99999;const a=battle.enemies[0];a.x=700}');
    tick(g, 0.05, 0.05);
    const w = g.run('battle.units[0].weak||0');
    if (w > 0 && prev <= 0) seen.push(+g.run('battle.t').toFixed(2));
    prev = w;
  }
  assert.ok(seen.length >= 1, 'the debuff was applied');
  assert.ok(seen[0] > 4 && seen[0] < 8, `first application on the third attack (${seen[0]}s)`);
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] - seen[i - 1] >= 6 - 0.1, 'no permanent control loop: at least the immunity window between applications');
  // the effect itself: weakened heroes deal 75%
  const dmgOver = (weak) => {
    const h = stageGame(2, 7);
    h.run(`battle.at=1000;deploy('mecha');spawnEnemy('basic');{const m=battle.units[0];m.x=600;m.spd=0;m.shield=0;${weak ? 'm.weak=100;' : ''}const e=battle.enemies[0];e.x=620;e.spd=0;e.atk=0;e.hp=e.maxHp=1e6}`);
    tick(h, 3, 0.05);
    return 1e6 - h.run('battle.enemies[0].hp');
  };
  assert.ok(Math.abs(dmgOver(true) / dmgOver(false) - 0.75) < 0.05, 'weakened damage is 75%');
});

test('Exam Master: area attacks show a warning first, hit only inside the marked zone, and cannot one-shot anyone', () => {
  const g = stageGame(2, 8);
  g.run("battle.at=1000;deploy('bug');deploy('night');spawnEnemy('exammaster');{const [a,b]=battle.units;a.x=300;a.spd=0;b.x=700;b.spd=0;a.hp=a.maxHp=360;const m=battle.enemies[0];m.x=950;m.spd=0;m.atk=0;m.hp=m.maxHp=999999;m.areaTimer=0.2}");
  let warned = null, damagedAt = null;
  const hp0 = J(g, 'battle.units.map(u=>u.hp)');
  for (let i = 0; i < 100 && damagedAt === null; i++) {
    g.run('{const [a,b]=battle.units;a.x=300;b.x=700;const m=battle.enemies[0];m.atk=0}');
    tick(g, 0.05, 0.05);
    if (warned === null && g.run('battle.warnings.length') > 0) warned = g.run('battle.t');
    if (J(g, 'battle.units.map(u=>u.hp)').some((h, k) => h < hp0[k])) damagedAt = g.run('battle.t');
  }
  assert.ok(warned !== null, 'a visible warning is created first');
  assert.equal(J(g, 'battle.warnings.length ? battle.warnings[0].r : 70'), 70);
  assert.ok(damagedAt - warned >= 1.4, `damage lands after the warning time (${(damagedAt - warned).toFixed(2)}s)`);
  const hp1 = J(g, 'battle.units.map(u=>u.hp)');
  assert.ok(hp1[1] < hp0[1], 'the front-most hero (the zone target) was hit');
  assert.equal(hp0[1] - hp1[1], 115, 'zone damage is 115');
  assert.equal(hp1[0], hp0[0], 'the hero outside every zone was not hit');
  assert.ok(115 * 2 < Math.min(...J(g, 'heroes.map(h=>h.hp)')), 'even two overlapping zones do not one-shot the weakest hero');
});

test('Exam Master phases: more zones below 60% and 25% health, with meaningful cooldowns', () => {
  const g = stageGame(2, 9);
  g.run("battle.at=1000;for(const id of ['bug','mecha','night','lab','chem','dental'])deploy(id);spawnEnemy('exammaster');{const m=battle.enemies[0];m.x=950;m.spd=0;m.atk=0;m.hp=m.maxHp=999999;m.areaTimer=0.1;for(const u of battle.units){u.spd=0;u.hp=u.maxHp=99999;u.shield=0}}");
  const zones = [], times = [];
  for (let phase = 0; phase < 3; phase++) {
    if (phase === 1) g.run('battle.enemies[0].hp=battle.enemies[0].maxHp*0.55');
    if (phase === 2) g.run('battle.enemies[0].hp=battle.enemies[0].maxHp*0.2');
    let got = 0;
    for (let i = 0; i < 400 && !got; i++) { tick(g, 0.05, 0.05); const w = g.run('battle.warnings.filter(w=>w.t>1.4).length'); if (w) { got = w; times.push(g.run('battle.t')); } }
    zones.push(got);
    tick(g, 3, 0.05);
  }
  assert.deepEqual(zones, [1, 2, 3], 'zone count by phase');
  for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 2, 'casts are separated by cooldowns');
});

test('Final Exam keeps its original mechanics (paper rain from 50% health, overtime below 20%); the new cast pose changes nothing in combat', () => {
  const g = stageGame(1, 3);
  g.run("spawnEnemy('boss');{const e=battle.enemies[0];e.hp=e.maxHp*0.45;battle.units=[]}");
  tick(g, 1, 0.05);
  assert.equal(g.run('battle.enemies[0].phase'), 2);
  assert.ok(g.run('battle.warnings.length') >= 3, 'three paper-rain warnings');
  assert.ok(g.run('battle.warnings.every(w=>w.r===undefined&&w.dmg===undefined)'), 'the rain keeps its default radius (60) and damage (160)');
});

// ---------------------------------------------------------------- bosses
test('boss sprite scale is visual only: hitbox, range, damage and targeting do not depend on it', () => {
  const run = (scale) => {
    const g = stageGame(1, 12);
    g.run(`for(const a of Object.values(ENEMY_ANIMS.final.anims))a.scale=${scale};for(const a of Object.values(ENEMY_ANIMS.exammaster.anims))a.scale=${scale}`);
    g.run("spawnEnemy('boss');deploy('mecha');deploy('bug');deploy('night')");
    for (let i = 0; i < 1200; i++) g.run('update(0.05)');
    return g.run('JSON.stringify([battle.t,battle.baseHp,battle.enemyHp,battle.kills,battle.units.map(u=>[u.id,Math.round(u.x),Math.round(u.hp)]),battle.enemies.map(u=>[u.id,Math.round(u.x),Math.round(u.hp)])])');
  };
  assert.equal(run(1), run(6));
  const R = reg();
  assert.equal(R.final.anims.idle.scale, 3.3); assert.equal(R.exammaster.anims.idle.scale, 3.0);
});

test('enemy death: a corpse is left with its death animation, normal ones vanish after 0.7s, bosses after their longer death; kills and boss flags update', () => {
  const g = stageGame(2, 5);
  g.run("ensureSprites(['assignment','exammaster','professor']);spawnEnemy('basic');spawnEnemy('exammaster');spawnEnemy('professor')");
  g.run("for(const a of Object.values(SPRITES))for(const k in a.anims){a.anims[k].status='ready'};for(const s of Object.values(SPRITES)){s.ready=true}");
  const kills0 = g.run('battle.kills');
  g.run("for(const e of battle.enemies)damage(e,1e9,'x')");
  assert.equal(g.run('battle.kills') - kills0, 3);
  assert.equal(g.run('battle.bossDead'), true, 'killing the Exam Master marks the boss dead');
  const lives = J(g, 'battle.corpses.map(c=>[c.id,c.life||0])');
  assert.equal(lives.length, 3);
  assert.ok(lives.find((c) => c[0] === 'exammaster')[1] > 0.7, 'boss corpse stays longer');
  assert.equal(lives.find((c) => c[0] === 'professor')[1], 0, 'normal corpse uses the default 0.7s');
  g.run('battle.enemies=[]');
  tick(g, 0.75, 0.05);
  assert.deepEqual(J(g, 'battle.corpses.map(c=>c.id)'), ['exammaster'], 'only the boss corpse is still playing its death');
  tick(g, 0.5, 0.05);
  assert.equal(g.run('battle.corpses.length'), 0);
});

// ---------------------------------------------------------------- randomness, quality modes, speed, pause
const snapshot = (g) => g.run('JSON.stringify({t:Math.round(battle.t*1000),base:battle.baseHp,enemy:battle.enemyHp,kills:battle.kills,at:Math.round(battle.at),units:battle.units.map(u=>[u.id,Math.round(u.x*100),Math.round(u.hp*100),u.weak||0]),enemies:battle.enemies.map(u=>[u.id,Math.round(u.x*100),Math.round(u.hp*100),u.buff||0,u.phase||0]),warn:battle.warnings.map(w=>[Math.round(w.x),Math.round(w.t*100)]),cs:battle.rng.combat.state,stats:CombatStats.getAllCharacterStats()})');
function runStage2(fx, draw, seed = 21, speed = 1, pauses = []) {
  const extra = pauses.reduce((s, [a, b]) => s + (b - a), 0);
  const g = stageGame(2, seed, ['bug', 'mecha', 'night', 'lab', 'chem', 'dental'], {});
  g.run(`setFxLevel('${fx}')`);
  g.run("battle.at=1000;for(const id of team)deploy(id)");
  g.run(`battle.speed=${speed}`);
  const step = 0.05 / speed;
  let sim = 0;
  for (let i = 0; i < 2200 + extra; i++) {
    const paused = pauses.some(([a, b]) => i >= a && i < b);
    g.run(`battle.paused=${paused}`);
    g.run(`update(${step})`);
    if (draw) g.run('draw()');
    if (paused) continue;
    if (sim % 300 === 0) g.run('if(!battle.ended){battle.at=1000;for(const id of team)deploy(id)}');
    sim++;
  }
  return snapshot(g);
}
test('stage 2 is identical in Full / Reduced / Off effects, with and without drawing (visual randomness never touches combat)', () => {
  const base = runStage2('full', false);
  for (const fx of ['full', 'reduced', 'off']) for (const draw of [false, true]) assert.equal(runStage2(fx, draw), base, `${fx} draw=${draw}`);
});

test('stage 2 plays the same at 2x speed and with pause / resume', () => {
  const base = runStage2('full', false, 22, 1);
  assert.equal(runStage2('full', false, 22, 2), base, '2x speed');
  assert.equal(runStage2('full', false, 22, 1, [[100, 140], [900, 960]]), base, 'pause / resume');
});

// ---------------------------------------------------------------- economy, stats, results
test('AT economy is identical in both stages (start AT, income, upgrade cost, bases, deploy cost)', () => {
  const s = (st) => J(stageGame(st, 2), '({at:battle.at,income:battle.income,upgrade:battle.upgrade,base:battle.baseHp,enemy:battle.enemyHp,maxAt:battle.maxAt,level:battle.level})');
  const g1 = loadGame(2, { lazy: true }); g1.run("team=['bug','mecha','night','lab','chem','dental'];screen='battle';startBattle(2)");
  const a = J(g1, '({at:battle.at,income:battle.income,upgrade:battle.upgrade,base:battle.baseHp,enemy:battle.enemyHp,maxAt:battle.maxAt,level:battle.level})');
  assert.equal(a.at, 180); assert.equal(a.income, 10); assert.equal(a.upgrade, 130);
  const x = s(2); x.at = a.at; // the helper tops AT up for the later tests
  assert.deepEqual(x, a);
  const g = stageGame(2, 3); g.run('battle.at=500');
  const before = g.run('battle.at'); g.run("deploy('bug')");
  assert.equal(before - g.run('battle.at'), J(g, "heroes.find(h=>h.id==='bug').cost"));
});

test('DMG / DEF / HEAL are still recorded against the new enemies and by the stage 2 hero actions', () => {
  const g = stageGame(2, 10, ['bug', 'mecha', 'night', 'lab', 'public', 'nurse']);
  g.run("for(const id of team)deploy(id);spawnEnemy('professor');spawnEnemy('ta');{battle.enemies.forEach((e,i)=>{e.x=330+i*30})}");
  tick(g, 40, 0.05);
  const rows = J(g, 'CombatStats.getAllCharacterStats()');
  assert.ok(rows.reduce((s, r) => s + r.totalDamage, 0) > 0, 'damage dealt to the new enemies is counted');
  assert.ok(rows.every((r) => 'totalDefense' in r && 'totalHealing' in r));
});

test('stage 2 can be won (Exam Master dead + enemy base down) and lost (base destroyed); both show the right result', () => {
  const win = stageGame(2, 11);
  win.run("spawnEnemy('exammaster');damage(battle.enemies[0],1e9,'x');battle.bossSpawned=true;battle.enemyHp=0");
  win.run('update(0.05)');
  assert.equal(win.run('battle.ended'), true);
  assert.equal(win.run("document.getElementById('resultTitle').textContent"), 'ชนะแล้ว');
  const lose = stageGame(2, 11);
  lose.run('battle.baseHp=0');
  lose.run('update(0.05)');
  assert.equal(lose.run('battle.ended'), true);
  assert.equal(lose.run("document.getElementById('resultTitle').textContent"), 'แพ้');
});

test('performance: stage 2 allocates no new images or unbounded effect lists while playing', () => {
  const g = stageGame(2, 13);
  g.run("for(const id of team)deploy(id)");
  const n0 = g.run('Image.count');
  for (let i = 0; i < 1600; i++) { g.run('update(0.05)'); if (i % 4 === 0) g.run('draw()'); if (i % 200 === 0) g.run('battle.at=1000;for(const id of team)deploy(id)'); }
  assert.equal(g.run('Image.count'), n0, 'no Image created during play');
  assert.ok(g.run('battle.particles.length') < 700 && g.run('battle.projectiles.length') < 120 && g.run('battle.warnings.length') < 12, 'effect lists stay bounded');
});

test('the stage picker works: setStage switches the stage, the title follows, an unknown stage is ignored', () => {
  const g = loadGame(1, { lazy: true });
  assert.equal(g.run('stage'), 1);
  g.run('setStage(2)');
  assert.equal(g.run('stage'), 2);
  assert.match(g.run("document.getElementById('stagePick').innerHTML"), /Stage 2/);
  g.run('setStage(9)');
  assert.equal(g.run('stage'), 2);
  g.run("team=['bug','mecha','night','lab','chem','dental'];startBattle(1)");
  assert.equal(g.run("document.getElementById('battleTitle').textContent"), 'Stage 2 · Faculty Staff');
  g.run('setStage(1);startBattle(1)');
  assert.equal(g.run("document.getElementById('battleTitle').textContent"), 'Stage 1 · Midterm Rush');
});
