// Reads the facts about the game that character configuration must agree with, straight from index.html (single source
// of truth): combat timing constants, default anchors, the hero table, SKILL_MODE, and what a character's skill effect
// does when the real engine plays it. Nothing here changes the game; it only observes it (headless test sandbox).
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const HTML = path.join(ROOT, 'index.html');

function readConstants(html = fs.readFileSync(HTML, 'utf8')) {
  const num = (name) => {
    const m = html.match(new RegExp(`\\b${name}=([0-9]*\\.?[0-9]+)`));
    if (!m) throw new Error(`cannot find constant ${name} in index.html`);
    return parseFloat(m[1]);
  };
  const pt = (name) => {
    const m = html.match(new RegExp(`${name}=\\[(-?\\d+),(-?\\d+)\\]`));
    if (!m) throw new Error(`cannot find ${name} in index.html`);
    return [parseInt(m[1], 10), parseInt(m[2], 10)];
  };
  const corpse = html.match(/corpses=b\.corpses\.filter\(c=>c\.t<([0-9]*\.?[0-9]+)\)/);
  if (!corpse) throw new Error('cannot find the corpse lifetime in index.html');
  return {
    attackDuration: num('ATK_DUR'),
    impactDelay: num('IMPACT_DELAY'),
    skillDuration: num('SKILL_DUR'),
    skillImpact: num('SKILL_IMPACT'),
    hurtDuration: num('HURT_DUR'),
    corpseLife: parseFloat(corpse[1]),
    muzzle: pt('DEFAULT_MUZZLE'),
  };
}

// a game instance for probing; pass the generated manifest / fx.js so the configuration under test is what the game uses
function makeGame(manifest, fx) {
  const opts = { lazy: true };
  if (manifest) opts.manifest = manifest;
  if (fx) opts.fx = fx;
  return require(path.join(ROOT, 'tests', 'harness')).loadGame(1, opts);
}

// hero table / skill tables as the running game sees them
function heroes(g) {
  return JSON.parse(g.run('JSON.stringify(heroes.map(h=>({id:h.id,name:h.name,f:h.f})))'));
}
function skillMode(g, id) { return g.run(`SKILL_MODE[${JSON.stringify(id)}]`) || null; }

// play the character's skill effect with the real engine at every effects level and report what it did
function skillFx(g, id) {
  if (!g.run(`typeof CHARACTER_FX!=='undefined'&&!!CHARACTER_FX[${JSON.stringify(id)}]`)) return null;
  const q = JSON.stringify(id);
  g.run('team=["bug"];screen="battle";startBattle(1)');
  const result = { kind: g.run(`CHARACTER_FX[${q}].kind`) };
  const play = (level) => {
    g.run(`setFxLevel(${JSON.stringify(level)});battle.particles.length=0;battle.flash=null`);
    const c0 = g.run('battle.rng.combat.draws');
    try { g.run(`runSkillFx({id:${q},x:300,y:300,ally:true})`); } catch (e) { return { error: e.message }; }
    return {
      particles: g.run('battle.particles.length'),
      flash: !!g.run('battle.flash'),
      maxLife: g.run('battle.particles.reduce((m,p)=>Math.max(m,p.life),0)'),
      combatDraws: g.run('battle.rng.combat.draws') - c0,
    };
  };
  const full = play('full'), reduced = play('reduced'), off = play('off');
  g.run('setFxLevel("full")');
  if (full.error || reduced.error || off.error) return { ...result, error: full.error || reduced.error || off.error };
  return { ...result, particles: full.particles, flash: full.flash, maxLife: full.maxLife, combatDraws: full.combatDraws + reduced.combatDraws + off.combatDraws, reducedParticles: reduced.particles, offParticles: off.particles };
}

module.exports = { ROOT, HTML, readConstants, makeGame, heroes, skillMode, skillFx };
