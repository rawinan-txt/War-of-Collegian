// Character configuration pipeline (Phase 1): character.json -> validated -> sprites.json + manifest.js (the format the game
// already loads). One character.json per character folder is the source of truth; the generated files are checked for
// staleness, so no data can silently drift.
//
//   node tools/characters.js build  [--root <dir>]          validate, then write sprites.json + manifest.js
//   node tools/characters.js check  [<id>] [--root <dir>] [--no-smoke] [--no-game]
//   node tools/characters.js list   [--root <dir>]
//
// Default root: public/assets/characters. Only characters with a character.json are managed; entries in sprites.json for
// characters without one (legacy `import-sprite.js add`) are left untouched.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validate } = require('./lib/jsonschema');
const probe = require('./lib/game-probe');
const imp = require('./import-sprite');

const DEFAULT_ROOT = path.join(probe.ROOT, 'public', 'assets', 'characters');
const SCHEMA = (root) => JSON.parse(fs.readFileSync(path.join(DEFAULT_ROOT, 'character.schema.json'), 'utf8'));
const STATES = ['idle', 'walk', 'attack', 'skill', 'hurt', 'stun', 'death'];
const LOOPS = { idle: true, walk: true, stun: true };
const MARGIN = 0.12;          // an event must land at least this far (in frames) inside its impact frame
const PALETTE_BODY = 40, PALETTE_TOTAL = 64, HEIGHT_BAND = 0.15;

// ---------------------------------------------------------------- loading
function listIds(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(root, d.name, 'character.json')))
    .map((d) => d.name).sort();
}
function loadDescriptor(root, id) {
  const file = path.join(root, id, 'character.json');
  try { return { desc: JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch (e) { return { error: `${id}/character.json: ${e.message}` }; }
}

// ---------------------------------------------------------------- timing
const ceilHalf = (x) => Math.ceil(x * 2 - 1e-9) / 2;
const roundHalf = (x) => Math.round(x * 2) / 2;
// the combat timing a state must fit (descriptor `timing` overrides the global constants, once the runtime supports it)
function timingFor(desc, C) { return { ...C, ...(desc.timing || {}) }; }

// computed fps for "fit"; null when the state cannot be fitted automatically
function fitFps(state, anim, T) {
  const n = anim.frames;
  if (state === 'attack' || state === 'skill') {
    if (anim.impact === undefined) return { error: `${state}: "fit" needs an impact frame` };
    const at = state === 'attack' ? T.impactDelay : T.skillImpact, dur = state === 'attack' ? T.attackDuration : T.skillDuration;
    const fps = ceilHalf(Math.max((anim.impact + MARGIN) / at, n / dur));
    return { fps };
  }
  if (state === 'hurt') return { fps: roundHalf(n / T.hurtDuration) };
  if (state === 'death') return { fps: roundHalf(n / T.corpseLife) };
  return { error: `${state}: "fit" is only available for attack, skill, hurt and death` };
}

// rules a final fps must satisfy for the combat timeline; returns a list of problems
function timingProblems(state, anim, fps, T) {
  const p = [], n = anim.frames;
  const hit = (at, impact, label) => {
    const pos = at * fps, frame = Math.floor(pos + 1e-9), frac = pos - impact;
    if (frame !== impact) p.push(`${state}: the ${label} (${at}s) shows frame ${frame}, but impact is frame ${impact} (fps ${fps})`);
    else if (frac < MARGIN - 1e-9 || frac > 1 - MARGIN + 1e-9) p.push(`${state}: the ${label} lands ${frac.toFixed(2)} frames into frame ${impact}; keep it between ${MARGIN} and ${1 - MARGIN} so one lagging tick still shows it (fps ${fps})`);
  };
  if (state === 'attack') { if (anim.impact === undefined) p.push('attack: impact frame is required'); else hit(T.impactDelay, anim.impact, 'projectile launch / hit'); if (n / fps > T.attackDuration + 1e-9) p.push(`attack: ${n} frames at ${fps} fps last ${(n / fps).toFixed(3)}s, longer than the swing (${T.attackDuration}s)`); }
  if (state === 'skill') { if (anim.impact === undefined) p.push('skill: impact frame is required'); else hit(T.skillImpact, anim.impact, 'skill effect'); if (n / fps > T.skillDuration + 1e-9) p.push(`skill: ${n} frames at ${fps} fps last ${(n / fps).toFixed(3)}s, longer than the skill (${T.skillDuration}s)`); }
  if (state === 'hurt' && n / fps > T.hurtDuration + 1e-9) p.push(`hurt: ${n} frames at ${fps} fps last ${(n / fps).toFixed(3)}s, longer than the reaction (${T.hurtDuration}s)`);
  if (state === 'death') {
    if ((n - 1) / fps >= T.corpseLife) p.push(`death: the last frame would appear after the corpse is removed (${T.corpseLife}s)`);
    if (n / fps > T.corpseLife + 0.06) p.push(`death: ${n} frames at ${fps} fps last ${(n / fps).toFixed(3)}s, longer than the corpse life (${T.corpseLife}s)`);
  }
  return p;
}

// ---------------------------------------------------------------- pixels
function readSheet(root, id, anim, frame) {
  const file = path.join(root, id, anim.file);
  if (!fs.existsSync(file)) return { error: `${anim.file}: file not found` };
  let img;
  try { img = imp.readPng(file); } catch (e) { return { error: e.message.replace(file, anim.file) }; }
  const [fw, fh] = frame;
  if (img.w !== fw * anim.frames || img.h !== fh) return { error: `${anim.file}: sheet is ${img.w}x${img.h} but ${anim.frames} frame(s) of ${fw}x${fh} need ${fw * anim.frames}x${fh}` };
  return { img, fw, fh };
}
const opaqueAt = (img, fw, f, x, y) => x >= 0 && y >= 0 && x < fw && y < img.h && img.rgba[(y * img.w + f * fw + x) * 4 + 3] > 0;
function frameStats(img, fw, f) {
  let count = 0, top = img.h, bottom = -1, left = fw, right = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < fw; x++) if (opaqueAt(img, fw, f, x, y)) { count++; top = Math.min(top, y); bottom = Math.max(bottom, y); left = Math.min(left, x); right = Math.max(right, x); }
  return { count, top, bottom, left, right };
}
function holes(img, fw, f) {
  let h = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < fw; x++) {
    if (opaqueAt(img, fw, f, x, y)) continue;
    if ((opaqueAt(img, fw, f, x - 1, y) && opaqueAt(img, fw, f, x + 1, y)) || (opaqueAt(img, fw, f, x, y - 1) && opaqueAt(img, fw, f, x, y + 1))) h++;
  }
  return h;
}
function colours(img) {
  const s = new Set();
  for (let i = 0; i < img.rgba.length; i += 4) if (img.rgba[i + 3]) s.add((img.rgba[i] << 16) | (img.rgba[i + 1] << 8) | img.rgba[i + 2]);
  return s;
}
// similarity of what an animation ADDS to the resting figure (moved limbs, effects): mean IoU over frames mapped by relative
// position, ignoring pixels that are part of the idle silhouette. Same frame size only. A hint for reviewers, never a verdict.
function silhouetteIoU(a, b, idle) {
  if (!idle || a.fw !== b.fw || a.img.h !== b.img.h || idle.fw !== a.fw) return null;
  const na = a.img.w / a.fw, nb = b.img.w / b.fw;
  let total = 0;
  for (let i = 0; i < nb; i++) {
    const j = nb === 1 ? 0 : Math.round((i * (na - 1)) / (nb - 1));
    let inter = 0, uni = 0;
    for (let y = 0; y < a.img.h; y++) for (let x = 0; x < a.fw; x++) { if (opaqueAt(idle.img, idle.fw, 0, x, y)) continue; const p = opaqueAt(a.img, a.fw, j, x, y), q = opaqueAt(b.img, b.fw, i, x, y); if (p && q) inter++; if (p || q) uni++; }
    total += uni ? inter / uni : 1;
  }
  return total / nb;
}

// ---------------------------------------------------------------- resolve (descriptor -> generated data)
function resolve(root, id, desc, C) {
  const problems = [];
  const T = timingFor(desc, C);
  const scale = desc.sprite.scale === undefined ? 2 : desc.sprite.scale;
  const sheets = {};
  const out = { scale, anims: {} };
  let feetRow = typeof desc.sprite.feetRow === 'number' ? desc.sprite.feetRow : null;
  for (const state of Object.keys(desc.anims)) {
    const a = desc.anims[state];
    const frame = a.frame || desc.sprite.frame;
    const sh = readSheet(root, id, a, frame);
    if (sh.error) { problems.push(sh.error); continue; }
    sheets[state] = sh;
  }
  if (sheets.idle && feetRow === null) feetRow = imp.lowestOpaqueRow(sheets.idle.img, sheets.idle.fw, sheets.idle.fh);
  for (const state of Object.keys(desc.anims)) {
    const a = desc.anims[state], sh = sheets[state];
    if (!sh) continue;
    let fps = a.fps === undefined ? 'fit' : a.fps;
    if (fps === 'fit') { const f = fitFps(state, a, T); if (f.error) { problems.push(f.error); continue; } fps = f.fps; }
    problems.push(...timingProblems(state, a, fps, T));
    const def = { file: `${id}/${a.file}`, frameWidth: sh.fw, frameHeight: sh.fh, frameCount: a.frames, frameRate: fps, repeat: (a.loop === undefined ? !!LOOPS[state] : a.loop) ? -1 : 0, feetRow };
    if (a.shadow === 'auto') def.shadow = imp.shadowFrames(sh.img, sh.fw, sh.fh, a.frames, feetRow);
    else if (Array.isArray(a.shadow)) { if (a.shadow.length !== a.frames) problems.push(`${state}: shadow table has ${a.shadow.length} entries for ${a.frames} frames`); def.shadow = a.shadow; }
    out.anims[state] = def;
    if (a.impact !== undefined && (state === 'attack' || state === 'skill')) (out.impact ||= {})[state] = a.impact;
    if (a.impact !== undefined && state !== 'attack' && state !== 'skill') problems.push(`${state}: impact is only used by attack and skill`);
  }
  if (desc.anchors && Object.keys(desc.anchors).length) out.anchors = desc.anchors;
  if (desc.fallback && Object.keys(desc.fallback).length) out.fallback = desc.fallback;
  return { out, sheets, feetRow, problems };
}

// the files the game reads, from all descriptors (+ untouched legacy entries)
function generate(root) {
  const ids = listIds(root), C = probe.readConstants();
  const cfg = imp.loadCfg(root);
  const problems = [];
  for (const id of ids) {
    const { desc, error } = loadDescriptor(root, id);
    if (error) { problems.push(error); continue; }
    const schemaErrors = validate(SCHEMA(root), desc);
    if (schemaErrors.length) { problems.push(...schemaErrors.map((e) => `${id}: ${e}`)); continue; }
    const r = resolve(root, id, desc, C);
    problems.push(...r.problems.map((e) => `${id}: ${e}`));
    if (!r.problems.length) cfg.characters[id] = r.out;
  }
  return { cfg, problems, sprites: JSON.stringify(cfg, null, 2) + '\n', manifest: imp.manifestText(cfg) };
}

function build(root) {
  const g = generate(root);
  if (g.problems.length) return { ok: false, problems: g.problems };
  fs.writeFileSync(path.join(root, 'sprites.json'), g.sprites);
  fs.writeFileSync(path.join(root, 'manifest.js'), g.manifest);
  return { ok: true, ids: listIds(root) };
}

// ---------------------------------------------------------------- check
let roster = null;
function rosterHeights() {
  if (roster) return roster;
  roster = [];
  try {
    const cfg = require(path.join(probe.ROOT, 'assets', 'characters', 'animations.json')).characters;
    for (const [id, c] of Object.entries(cfg)) {
      if (id === 'dog') continue;
      const img = imp.readPng(path.join(probe.ROOT, c.anims.idle.sheet));
      const s = frameStats(img, c.anims.idle.frameWidth, 0);
      roster.push((s.bottom - s.top + 1) * 2);
    }
  } catch (e) { roster = []; }
  roster.sort((a, b) => a - b);
  return roster;
}

function check(root, { only = null, smoke = true, game = true } = {}) {
  const res = { errors: [], warnings: [], info: [], characters: {} };
  const E = (id, m) => res.errors.push(`${id}: ${m}`), W = (id, m) => res.warnings.push(`${id}: ${m}`), I = (id, m) => res.info.push(`${id}: ${m}`);
  const ids = listIds(root).filter((i) => !only || i === only);
  if (only && !ids.length) { res.errors.push(`${only}: no character.json in ${path.join(root, only)}`); return res; }
  const C = probe.readConstants();
  const schema = SCHEMA(root);
  let heroes = null, gm = null;
  if (game) {
    const gen = generate(root);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'char-probe-'));
    fs.writeFileSync(path.join(dir, 'manifest.js'), gen.problems.length ? 'void 0;\n' : gen.manifest);
    gm = probe.makeGame(path.join(dir, 'manifest.js'));
    heroes = probe.heroes(gm);
  }

  const resolved = {};
  for (const id of ids) {
    const { desc, error } = loadDescriptor(root, id);
    if (error) { res.errors.push(error); continue; }
    const se = validate(schema, desc);
    if (se.length) { se.forEach((e) => E(id, e)); continue; }
    if (desc.id !== id) E(id, `id "${desc.id}" does not match the folder name`);
    // --- consistency with the game (duplicated data must agree)
    const T = timingFor(desc, C);
    for (const k of Object.keys(desc.timing || {})) if (Math.abs(desc.timing[k] - C[k]) > 1e-9) E(id, `timing.${k} = ${desc.timing[k]} differs from the game's ${C[k]}; the runtime does not read per-character timing yet (Phase 2)`);
    if (game) {
      const hero = heroes.find((h) => h.id === id);
      if (!hero) E(id, 'no hero with this id in the game (hero data is not data-driven yet; add the gameplay entry first)');
      else {
        if (hero.name !== desc.name) E(id, `name "${desc.name}" differs from the game's "${hero.name}"`);
        if (desc.faculty && hero.f !== desc.faculty) E(id, `faculty "${desc.faculty}" differs from the game's "${hero.f}"`);
        const sig = desc.signature || {};
        const gmode = probe.skillMode(gm, id);
        if (sig.skillMode && gmode !== sig.skillMode) E(id, `signature.skillMode "${sig.skillMode}" differs from SKILL_MODE "${gmode}" in the game`);
        const gfx = probe.skillFx(gm, id);
        if (sig.fx) {
          if (!gfx) W(id, 'signature.fx is defined but the game has no SKILL_FX entry; it is not used until Phase 4');
          else {
            if (gfx.kind !== sig.fx.kind) E(id, `signature.fx.kind "${sig.fx.kind}" differs from SKILL_FX kind "${gfx.kind}"`);
            const want = JSON.stringify(sig.fx.ops.map(probe.opToCall)), have = JSON.stringify(gfx.calls);
            if (want !== have) E(id, `signature.fx.ops do not reproduce the game's SKILL_FX effect\n    config: ${want}\n    game:   ${have}`);
          }
        } else if (gfx) I(id, 'the game has a SKILL_FX entry that character.json does not describe yet');
      }
    }
    // --- fallback chains
    for (const [state, chain] of Object.entries(desc.fallback || {})) {
      if (desc.anims[state]) W(id, `fallback.${state} is unused because ${state} has a sheet`);
      for (const s of chain) if (!desc.anims[s] && !chain.slice(0, chain.indexOf(s)).length) { /* resolved below */ }
      if (!chain.some((s) => desc.anims[s])) E(id, `fallback.${state} ${JSON.stringify(chain)} ends without any existing animation`);
    }
    // --- sheets
    const r = resolve(root, id, desc, C);
    r.problems.forEach((p) => E(id, p));
    resolved[id] = { desc, r, T };
    const sheets = r.sheets;
    const idle = sheets.idle;
    const allColours = new Set(), idleColours = idle ? colours(idle.img) : new Set();
    for (const [state, sh] of Object.entries(sheets)) {
      const { img, fw } = sh, n = desc.anims[state].frames;
      let soft = 0;
      for (let i = 3; i < img.rgba.length; i += 4) if (img.rgba[i] !== 0 && img.rgba[i] !== 255) soft++;
      if (soft) E(id, `${state}: ${soft} semi-transparent pixels (hard edges only)`);
      let transparent = 0;
      for (let i = 3; i < img.rgba.length; i += 4) if (img.rgba[i] === 0) transparent++;
      if (!transparent) E(id, `${state}: no transparent pixels`);
      for (let f = 0; f < n; f++) {
        const s = frameStats(img, fw, f);
        if (!s.count) { E(id, `${state} frame ${f}: empty`); continue; }
        if (s.left <= 0 || s.right >= fw - 1 || s.top <= 0 || s.bottom >= img.h - 1) E(id, `${state} frame ${f}: touches the frame edge (clipped?)`);
      }
      for (const c of colours(img)) allColours.add(c);
      // feet on the ground line
      if (state !== 'death' && r.feetRow !== null) {
        const b0 = frameStats(img, fw, 0).bottom;
        if (Math.abs(b0 - r.feetRow) > 2) E(id, `${state}: feet at row ${b0}, expected ${r.feetRow}`);
        else if (b0 !== r.feetRow) W(id, `${state}: first frame feet at row ${b0}, ground line is ${r.feetRow}`);
      } else if (state === 'death' && r.feetRow !== null) {
        const last = Math.max(...Array.from({ length: n }, (_, f) => frameStats(img, fw, f).bottom));
        if (Math.abs(last - r.feetRow) > 2) E(id, `death: the figure never rests on the ground line (lowest row ${last}, expected ${r.feetRow})`);
      }
      // holes against idle
      if (idle && ['idle', 'walk', 'hurt', 'stun'].includes(state)) { // attack/skill carry separate effect pixels on purpose
        const base = holes(idle.img, idle.fw, 0);
        const worst = Math.max(...Array.from({ length: n }, (_, f) => holes(img, fw, f)));
        if (worst > base + 6) W(id, `${state}: up to ${worst} one-pixel holes per frame (idle has ${base})`);
      }
    }
    // death last frame must be (almost) gone, shadow follows
    if (sheets.death) {
      const n = desc.anims.death.frames, counts = Array.from({ length: n }, (_, f) => frameStats(sheets.death.img, sheets.death.fw, f).count);
      if (counts[n - 1] > Math.max(...counts) * 0.3) W(id, 'death: the last frame is not mostly dissolved; the corpse will pop out of existence');
    }
    // palette
    if (idle && idleColours.size > PALETTE_BODY) W(id, `idle uses ${idleColours.size} colours (budget ${PALETTE_BODY})`);
    if (allColours.size > PALETTE_TOTAL) W(id, `${allColours.size} colours across all sheets (budget ${PALETTE_TOTAL})`);
    if (idle) {
      for (const state of Object.keys(sheets)) {
        if (state === 'idle') continue;
        const cs = colours(sheets[state].img); let shared = 0;
        for (const c of cs) if (idleColours.has(c)) shared++;
        if (cs.size && shared / cs.size < 0.6) W(id, `${state}: only ${Math.round((shared / cs.size) * 100)}% of its colours also appear in idle (identity drift?)`);
      }
    }
    // height band against the roster
    if (idle) {
      const h = roster ? null : null; void h;
      const heights = rosterHeights();
      if (heights.length) {
        const median = heights[Math.floor(heights.length / 2)];
        const s = frameStats(idle.img, idle.fw, 0), hh = (s.bottom - s.top + 1) * r.out.scale;
        if (Math.abs(hh - median) / median > HEIGHT_BAND) W(id, `on-screen height ${hh}px is outside the roster band (median ${median}px +-${HEIGHT_BAND * 100}%)`);
        res.characters[id] = { ...(res.characters[id] || {}), height: hh, rosterMedian: median };
      }
    }
    // animation similarity: warning only, never a verdict on whether skills are duplicates
    if (sheets.skill && sheets.attack) {
      const iou = silhouetteIoU(sheets.attack, sheets.skill, idle);
      if (iou !== null && iou > 0.9) W(id, `skill and attack add ${Math.round(iou * 100)}% the same pixels to the resting figure; check that the skill animation is really its own (this is a hint, not a verdict)`);
    }
    // completeness
    const missing = STATES.filter((s) => !desc.anims[s]);
    const grade = missing.length === 0 ? 'Gold' : desc.anims.walk && desc.anims.attack ? 'Silver' : 'Bronze';
    for (const s of missing) {
      const chain = (desc.fallback || {})[s];
      if (chain) I(id, `${s}: no sheet; falls back along ${chain.join(' > ')}`);
      else W(id, `${s}: no sheet and no explicit fallback; the game will silently fall back to idle - add fallback.${s} to character.json`);
    }
    res.characters[id] = { ...(res.characters[id] || {}), grade, states: Object.keys(desc.anims).length, colours: allColours.size };
  }

  // --- generated files must match the descriptors
  if (!only) {
    const g = generate(root);
    if (!g.problems.length) {
      const read = (f) => (fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), 'utf8') : null);
      if (read('sprites.json') !== g.sprites) E('generated', 'sprites.json is out of date; run: node tools/characters.js build');
      if (read('manifest.js') !== g.manifest) E('generated', 'manifest.js is out of date; run: node tools/characters.js build');
    }
  }

  // --- smoke: the game draws every state of every checked character and the impact frame is what the config says
  if (smoke && game && !res.errors.length) {
    try {
      gm.run(`ensureSprites(${JSON.stringify(ids)})`);
      for (const id of ids) {
        const { desc } = resolved[id];
        if (!gm.run(`spriteReady(${JSON.stringify(id)})`)) { E(id, 'smoke: the game does not consider the sprite ready'); continue; }
        for (const state of Object.keys(desc.anims)) {
          const def = JSON.parse(gm.run(`JSON.stringify(SPRITES[${JSON.stringify(id)}].anims.${state}.def)`));
          for (const ally of [true, false]) for (const t of [0, 0.1, 0.3, 0.69, 5]) {
            gm.run('ctx.__calls.length=0');
            try { gm.run(`drawSpriteFrame(${JSON.stringify(id)},${JSON.stringify(state)},${t},300,200,${ally})`); } catch (e) { E(id, `smoke: drawing ${state} throws ${e.message}`); continue; }
            const calls = JSON.parse(gm.run('JSON.stringify(ctx.__calls.filter(c=>c.k==="drawImage"))'));
            if (calls.length !== 1) { E(id, `smoke: ${state} draws ${calls.length} images`); continue; }
            const a = calls[0].args;
            if (a[3] !== def.frameWidth || a[4] !== def.frameHeight) E(id, `smoke: ${state} source rect ${a[3]}x${a[4]} differs from the configured frame`);
          }
          if (desc.anims[state].impact !== undefined) {
            const at = state === 'attack' ? T_of(resolved[id]).impactDelay : T_of(resolved[id]).skillImpact;
            const frame = gm.run(`frameIndex(SPRITES[${JSON.stringify(id)}].anims.${state}.def,${at})`);
            if (frame !== desc.anims[state].impact) E(id, `smoke: ${state} impact frame is ${frame} in the game, config says ${desc.anims[state].impact}`);
          }
        }
      }
    } catch (e) { res.errors.push(`smoke: ${e.message}`); }
  }
  return res;
}
const T_of = (r) => r.T;

// ---------------------------------------------------------------- CLI
function parseArgs(argv) {
  const pos = [], o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') o.root = argv[++i]; else if (argv[i].startsWith('--')) o[argv[i].slice(2)] = true; else pos.push(argv[i]);
  }
  return { pos, o };
}
function printResult(res) {
  for (const e of res.errors) console.error('ERROR  ' + e);
  for (const w of res.warnings) console.warn('warn   ' + w);
  for (const i of res.info) console.log('info   ' + i);
  for (const [id, c] of Object.entries(res.characters)) console.log(`${id}: grade ${c.grade}, ${c.states}/7 states, ${c.colours} colours${c.height ? `, ${c.height}px tall (roster median ${c.rosterMedian}px)` : ''}`);
}

if (require.main === module) {
  const { pos, o } = parseArgs(process.argv.slice(2));
  const root = o.root ? path.resolve(o.root) : DEFAULT_ROOT;
  const [cmd, id] = pos;
  try {
    if (cmd === 'build') {
      const pre = check(root, { smoke: false, game: !o['no-game'] });
      // generated-file staleness is exactly what build fixes, so it is not a blocker here
      const blockers = pre.errors.filter((e) => !e.startsWith('generated:'));
      if (blockers.length) { printResult({ ...pre, errors: blockers }); console.error(`\nbuild refused: ${blockers.length} error(s)`); process.exit(1); }
      const r = build(root);
      if (!r.ok) { r.problems.forEach((p) => console.error('ERROR  ' + p)); process.exit(1); }
      printResult({ ...pre, errors: [] });
      console.log(`built sprites.json and manifest.js for: ${r.ids.join(', ') || '(none)'}`);
    } else if (cmd === 'check') {
      const res = check(root, { only: id || null, smoke: !o['no-smoke'], game: !o['no-game'] });
      printResult(res);
      if (res.errors.length) { console.error(`\n${res.errors.length} error(s), ${res.warnings.length} warning(s)`); process.exit(1); }
      console.log(`\nok: ${Object.keys(res.characters).length} character(s), ${res.warnings.length} warning(s)`);
    } else if (cmd === 'list') {
      for (const i of listIds(root)) { const { desc } = loadDescriptor(root, i); console.log(`${i}\t${desc ? desc.name : '?'}\t${desc ? Object.keys(desc.anims).join(',') : ''}`); }
    } else { console.log('usage: build | check [id] [--no-smoke] [--no-game] | list   [--root <dir>]'); process.exit(cmd ? 1 : 0); }
  } catch (e) { console.error('error: ' + e.message); process.exit(1); }
}
module.exports = { listIds, loadDescriptor, resolve, generate, build, check, fitFps, timingProblems, STATES };
