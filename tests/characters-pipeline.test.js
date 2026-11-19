// Phase 1 of the character pipeline: schema, build, check, equivalence with the shipped manifest, add-by-configuration.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { decodePng, encodePng } = require('../tools/pixel/png');
const { validate } = require('../tools/lib/jsonschema');
const probe = require('../tools/lib/game-probe');
const pipe = require('../tools/characters');
const imp = require('../tools/import-sprite');
const { loadGame, tick } = require('./harness');

const ROOT = path.join(__dirname, '..');
const SHIPPED = path.join(ROOT, 'public', 'assets', 'characters');
const schema = JSON.parse(fs.readFileSync(path.join(SHIPPED, 'character.schema.json'), 'utf8'));
const bugDesc = () => JSON.parse(fs.readFileSync(path.join(SHIPPED, 'bug', 'character.json'), 'utf8'));
const C = probe.readConstants();

function tmpRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'char-pipe-'));
  fs.cpSync(path.join(SHIPPED, 'bug'), path.join(root, 'bug'), { recursive: true });
  fs.copyFileSync(path.join(SHIPPED, 'sprites.json'), path.join(root, 'sprites.json'));
  fs.copyFileSync(path.join(SHIPPED, 'manifest.js'), path.join(root, 'manifest.js'));
  return root;
}
const writeDesc = (root, id, d) => fs.writeFileSync(path.join(root, id, 'character.json'), JSON.stringify(d, null, 2));
const errorsOf = (root, opts = {}) => pipe.check(root, { smoke: false, ...opts }).errors.join('\n');

// ---------------------------------------------------------------- schema
test('schema: the shipped Bug Hunter descriptor is valid', () => {
  assert.deepEqual(validate(schema, bugDesc()), []);
});

test('schema rejects: missing idle, unknown state, bad fps, unknown field, wrong types, bad op', () => {
  const bad = (mut) => { const d = bugDesc(); mut(d); return validate(schema, d).join(' | '); };
  assert.match(bad((d) => { delete d.anims.idle; }), /missing required "idle"/);
  assert.match(bad((d) => { d.anims.dance = d.anims.idle; }), /unknown property "dance"/);
  assert.match(bad((d) => { d.anims.idle.fps = 'fast'; }), /fps/);
  assert.match(bad((d) => { d.anims.idle.fps = -3; }), /fps/);
  assert.match(bad((d) => { d.extra = 1; }), /unknown property "extra"/);
  assert.match(bad((d) => { d.id = 'Bad Id'; }), /does not match/);
  assert.match(bad((d) => { d.anims.attack.frames = 2.5; }), /expected integer/);
  assert.match(bad((d) => { d.sprite.frame = [8, 8]; }), /below the minimum/);
  assert.match(bad((d) => { d.signature.fx.ops.push({ op: 'laser' }); }), /does not match any allowed form/);
  assert.match(bad((d) => { d.fallback.skill = ['flying']; }), /must be one of/);
  assert.match(bad((d) => { d.signature.skillMode = 'always'; }), /must be one of/);
});

// ---------------------------------------------------------------- timing
test('fps "fit" reproduces the values Bug Hunter ships with, and fixed fps is validated by the same rules', () => {
  assert.equal(pipe.fitFps('attack', { frames: 6, impact: 3 }, C).fps, 12.5);
  assert.equal(pipe.fitFps('skill', { frames: 12, impact: 7 }, C).fps, 17);
  assert.equal(pipe.fitFps('hurt', { frames: 3 }, C).fps, 12);
  assert.equal(pipe.fitFps('death', { frames: 6 }, C).fps, 8.5);
  assert.ok(pipe.fitFps('idle', { frames: 4 }, C).error, 'idle cannot be fitted');
  assert.ok(pipe.fitFps('attack', { frames: 6 }, C).error, 'fit needs an impact frame');
  // a fixed fps that misses the impact frame is an error, one inside it is fine
  assert.equal(pipe.timingProblems('attack', { frames: 6, impact: 3 }, 12.5, C).length, 0);
  assert.match(pipe.timingProblems('attack', { frames: 6, impact: 3 }, 8, C).join(), /shows frame 2/);
  assert.match(pipe.timingProblems('attack', { frames: 6, impact: 3 }, 20, C).join(), /shows frame 5/);
  assert.match(pipe.timingProblems('attack', { frames: 6, impact: 3 }, 12, C).join(), /lands 0\.00 frames|between/, 'no safety margin at exactly 12 fps');
  assert.match(pipe.timingProblems('skill', { frames: 16, impact: 7 }, 17, C).join(), /longer than the skill/);
  assert.match(pipe.timingProblems('death', { frames: 6 }, 5, C).join(), /after the corpse is removed|longer/);
});

test('game constants are read from index.html (single source), and equal what Bug Hunter was tuned for', () => {
  assert.deepEqual(C, { attackDuration: 0.5, impactDelay: 0.25, skillDuration: 0.72, skillImpact: 0.43, hurtDuration: 0.25, corpseLife: 0.7, muzzle: [18, -14] });
});

// ---------------------------------------------------------------- equivalence
test('the pipeline generates sprites.json and manifest.js identical to the shipped ones (byte for byte)', () => {
  const root = tmpRoot();
  fs.rmSync(path.join(root, 'sprites.json')); fs.rmSync(path.join(root, 'manifest.js'));
  fs.writeFileSync(path.join(root, 'sprites.json'), JSON.stringify({ version: 1, characters: {} }, null, 2) + '\n');
  const r = pipe.build(root);
  assert.ok(r.ok, JSON.stringify(r.problems));
  for (const f of ['sprites.json', 'manifest.js']) assert.equal(fs.readFileSync(path.join(root, f), 'utf8'), fs.readFileSync(path.join(SHIPPED, f), 'utf8'), f);
  const fxOf = (dir) => { const c = {}; new Function('globalThis', fs.readFileSync(path.join(dir, 'fx.js'), 'utf8'))(c); return c.CHARACTER_FX; };
  assert.deepEqual(fxOf(root).bug, fxOf(SHIPPED).bug, 'effect data of the character');
});

test('shipped files are in sync with character.json, and the full check (schema, art, timing, game, smoke) has no errors', () => {
  const res = pipe.check(SHIPPED);
  assert.deepEqual(res.errors, []);
  assert.equal(res.characters.bug.grade, 'Gold');
  assert.equal(res.characters.bug.states, 7);
});

test('the generated manifest drives the game exactly like the old one: same animation data, same battle', () => {
  const g = pipe.generate(SHIPPED);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'char-eq-'));
  fs.writeFileSync(path.join(dir, 'manifest.js'), g.manifest);
  const run = (manifest) => {
    const game = loadGame(13, { manifest });
    game.run(`team=['bug','mecha','night','lab','chem','dental'];startBattle();battle.at=1000;battle.income=0;for(const id of team)deploy(id)`);
    tick(game, 30, 1 / 30);
    return game.run(`JSON.stringify({anim:CHARACTER_ANIMS.bug,kills:battle.kills,base:battle.baseHp,enemy:battle.enemyHp,stats:CombatStats.getAllCharacterStats(),units:battle.units.map(u=>[u.id,u.hp,u.x])})`);
  };
  assert.equal(run(path.join(dir, 'manifest.js')), run(path.join(SHIPPED, 'manifest.js')));
});

// ---------------------------------------------------------------- consistency with the game
test('consistency: name, faculty, skill mode and timing must agree with the game; effect data must be valid and unique', () => {
  const root = tmpRoot();
  fs.cpSync(path.join(SHIPPED, 'mecha'), path.join(root, 'mecha'), { recursive: true });
  const with_ = (mut) => { const d = bugDesc(); mut(d); writeDesc(root, 'bug', d); return errorsOf(root, { only: 'bug' }); };
  assert.equal(with_(() => {}), '');
  assert.match(with_((d) => { d.name = 'Bug Catcher'; }), /name "Bug Catcher" differs/);
  assert.match(with_((d) => { d.faculty = 'EG'; }), /faculty "EG" differs/);
  assert.match(with_((d) => { d.signature.skillMode = 'onDeploy'; }), /skillMode "onDeploy" differs from SKILL_MODE "onStack"/);
  assert.match(with_((d) => { d.signature.fx.kind = 'gear-barrier'; }), /fx.kind "gear-barrier" is also used by mecha/);
  assert.match(with_((d) => { d.signature.fx.ops[0].to = [1]; }), /does not match any allowed form/);
  assert.match(with_((d) => { d.signature.fx.ops = [{ op: 'shake', amount: 2 }]; }), /draws nothing at full effects/);
  assert.match(with_((d) => { d.signature.fx.ops = [{ op: 'beam', from: [0, 0], to: [10, 0], color: 'red' }]; }), /does not match/);
  assert.equal(with_((d) => { d.anchors.muzzle = [20, -14]; }), '', 'the muzzle anchor is read by the runtime');
  assert.equal(with_((d) => { d.anchors.skill = [30, -30]; }), '', 'the skill anchor moves the effect; the effect is data, so it is valid');
  assert.match(with_((d) => { d.timing.attackDuration = 0.6; }), /timing.attackDuration = 0.6 differs/);
  assert.match(with_((d) => { d.id = 'bugz'; }), /does not match the folder name/);
});

test('consistency: a character id that is not a hero in the game is an error', () => {
  const root = tmpRoot();
  fs.cpSync(path.join(root, 'bug'), path.join(root, 'ghost'), { recursive: true });
  const d = bugDesc(); d.id = 'ghost'; d.signature = undefined; delete d.signature; d.name = 'Ghost';
  writeDesc(root, 'ghost', d);
  assert.match(errorsOf(root, { only: 'ghost' }), /no hero with this id in the game/);
});

// ---------------------------------------------------------------- art validation
function rewriteSheet(root, file, edit) {
  const p = path.join(root, 'bug', file);
  const img = decodePng(fs.readFileSync(p));
  const rgba = Buffer.from(img.rgba);
  edit(rgba, img);
  fs.writeFileSync(p, encodePng(img.w, img.h, rgba));
}
test('art validation catches soft alpha, frame-edge contact, wrong sheet size, wrong feet row, a missing file', () => {
  let root = tmpRoot();
  rewriteSheet(root, 'attack.png', (px, img) => { px[(60 * img.w + 120) * 4 + 3] = 128; });
  assert.match(errorsOf(root, { only: 'bug' }), /attack: 1 semi-transparent pixels/);

  root = tmpRoot();
  rewriteSheet(root, 'walk.png', (px, img) => { const x = 96 * 2 + 0, y = 50; px.set([255, 0, 0, 255], (y * img.w + x) * 4); });
  assert.match(errorsOf(root, { only: 'bug' }), /walk frame 2: touches the frame edge/);

  root = tmpRoot();
  const d = bugDesc(); d.anims.walk.frames = 5; writeDesc(root, 'bug', d);
  assert.match(errorsOf(root, { only: 'bug' }), /walk.png: sheet is 576x96 but 5 frame\(s\)/);

  root = tmpRoot();
  const d2 = bugDesc(); d2.sprite.feetRow = 80; writeDesc(root, 'bug', d2);
  assert.match(errorsOf(root, { only: 'bug' }), /feet at row 89, expected 80/);

  root = tmpRoot();
  fs.rmSync(path.join(root, 'bug', 'hurt.png'));
  assert.match(errorsOf(root, { only: 'bug' }), /hurt.png: file not found/);
});

test('timing errors in a descriptor are reported with the frame numbers', () => {
  const root = tmpRoot();
  const d = bugDesc(); d.anims.attack.fps = 8; d.anims.skill.impact = 5; writeDesc(root, 'bug', d);
  const e = errorsOf(root, { only: 'bug' });
  assert.match(e, /attack: the projectile launch \/ hit \(0.25s\) shows frame 2, but impact is frame 3/);
  assert.match(e, /skill: the skill effect \(0.43s\) shows frame 7, but impact is frame 5/);
});

test('similar animation is a warning only, never an error (no automatic duplicate verdict)', () => {
  const root = tmpRoot();
  fs.copyFileSync(path.join(root, 'bug', 'attack.png'), path.join(root, 'bug', 'skill.png')); // a skill that is literally the attack
  const d = bugDesc(); d.anims.skill = { file: 'skill.png', frames: 6, fps: 'fit', impact: 3 }; writeDesc(root, 'bug', d);
  const res = pipe.check(root, { only: 'bug', smoke: false, game: false });
  assert.ok(res.warnings.some((w) => /skill and attack add 100% the same pixels/.test(w)), 'warns: ' + res.warnings.join(' | '));
  assert.deepEqual(res.errors, [], 'the warning does not fail the check: ' + res.errors.join(' | '));
});

// ---------------------------------------------------------------- generated files cannot drift
test('stale generated files are detected; build refuses invalid configuration and does not touch the files', () => {
  const root = tmpRoot();
  const sp = JSON.parse(fs.readFileSync(path.join(root, 'sprites.json'), 'utf8'));
  sp.characters.bug.anims.attack.frameRate = 9;
  fs.writeFileSync(path.join(root, 'sprites.json'), JSON.stringify(sp, null, 2) + '\n');
  assert.match(errorsOf(root), /sprites.json is out of date/);
  const before = fs.readFileSync(path.join(root, 'manifest.js'), 'utf8');
  const d = bugDesc(); d.anims.attack.fps = 99; writeDesc(root, 'bug', d);
  const r = pipe.build(root);
  assert.equal(r.ok, false);
  assert.equal(fs.readFileSync(path.join(root, 'manifest.js'), 'utf8'), before, 'nothing written on error');
});

test('characters managed by character.json cannot be edited with the legacy importer (one source of truth)', () => {
  const root = tmpRoot();
  assert.throws(() => imp.add(root, 'bug', path.join(root, 'bug', 'idle.png'), { anim: 'idle', frames: '4', frame: '96x96' }), /character\.json/);
  assert.throws(() => imp.remove(root, 'bug'), /character\.json/);
});

// ---------------------------------------------------------------- add a character by configuration only
function strip(file, n, w, h, feet, { width = 16, thick = 30 } = {}) {
  const rgba = Buffer.alloc(n * w * h * 4);
  for (let f = 0; f < n; f++) for (let y = feet - thick + 1; y <= feet; y++) for (let x = w / 2 - width / 2 + (f % 2); x < w / 2 + width / 2 + (f % 2); x++) rgba.set([200 - f * 10, 90, 120, 255], (y * n * w + f * w + x) * 4);
  fs.writeFileSync(file, encodePng(n * w, h, rgba));
}
test('a new character is added by configuration only: files + character.json, build, and the unchanged game draws it', () => {
  const root = tmpRoot();
  fs.mkdirSync(path.join(root, 'nurse'));
  strip(path.join(root, 'nurse', 'idle.png'), 2, 64, 64, 55);
  strip(path.join(root, 'nurse', 'attack.png'), 5, 64, 64, 55);
  strip(path.join(root, 'nurse', 'hurt.png'), 3, 64, 64, 55);
  writeDesc(root, 'nurse', {
    id: 'nurse', name: 'Angel of Care', faculty: 'NS',
    sprite: { frame: [64, 64], scale: 2, feetRow: 'auto', facing: 'right' },
    anims: {
      idle: { file: 'idle.png', frames: 2, fps: 4, loop: true },
      attack: { file: 'attack.png', frames: 5, fps: 'fit', impact: 2 },
      hurt: { file: 'hurt.png', frames: 3, fps: 'fit' },
    },
    fallback: { walk: ['idle'], skill: ['attack', 'idle'], stun: ['hurt', 'idle'], death: ['hurt', 'idle'] },
  });
  const res = pipe.check(root, { only: 'nurse' });
  assert.deepEqual(res.errors, [], res.errors.join('\n'));
  assert.equal(res.characters.nurse.grade, 'Bronze', 'no walk sheet: Bronze');
  assert.ok(res.info.some((i) => /nurse: skill: no sheet; falls back along attack > idle/.test(i)));
  const b = pipe.build(root);
  assert.ok(b.ok, JSON.stringify(b.problems));
  assert.deepEqual(pipe.check(root).errors, [], 'after build the whole root is consistent');
  // the unchanged game picks it up from the generated manifest alone
  const g = loadGame(1, { manifest: path.join(root, 'manifest.js') });
  assert.equal(g.run('spriteReady("nurse")'), true);
  assert.equal(g.run('CHARACTER_ANIMS.nurse.external'), true);
  const cfg = JSON.parse(g.run('JSON.stringify(SPRITES.nurse.anims.attack.def)'));
  assert.deepEqual([cfg.frameCount, cfg.frameRate, cfg.frameWidth, cfg.feetRow, cfg.scale], [5, 10, 64, 55, 2]);
  assert.equal(g.run('frameIndex(SPRITES.nurse.anims.attack.def, IMPACT_DELAY)'), 2);
  g.run('ctx.__calls.length=0;drawSpriteFrame("nurse","idle",0,300,200,true)');
  const a = JSON.parse(g.run('JSON.stringify(ctx.__calls.filter(c=>c.k==="drawImage")[0].args.slice(1))'));
  assert.deepEqual([a[2], a[3], a[6], a[7]], [64, 64, 128, 128], 'source 64x64 drawn at scale 2');
  assert.equal(a[5], Math.round(200 + 24 - (55 + 1) * 2), 'feet row sits on the ground line');
  // Bug Hunter is unaffected by the new neighbour
  assert.ok(JSON.parse(g.run('JSON.stringify(SPRITES.bug.anims.death.def.shadow)')).length === 6);
});
