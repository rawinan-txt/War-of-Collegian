// Reads the facts about the game that character configuration must agree with, straight from index.html (single source
// of truth): combat timing constants, default anchors, the hero table, SKILL_MODE, and what a character's skill effect
// does when the real engine plays it. Nothing here changes the game; it only observes it (headless test sandbox).
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const HTML = path.join(ROOT, 'index.html');

// Values come from the running game (headless harness), so the code can be reformatted freely without breaking this.
// The corpse lifetime is measured: a corpse is stepped with the real update() until the game removes it.
function readConstants() {
  const g = require(path.join(ROOT, 'tests', 'harness')).loadGame(1, { lazy: true });
  const J = (code) => JSON.parse(g.run(`JSON.stringify(${code})`));
  g.run("team=['bug'];screen='battle';startBattle(1)");
  g.run("battle.corpses=[{id:'bug',x:0,y:0,t:0,ally:true}]");
  let steps = 0;
  while (J('battle.corpses.length') > 0 && steps < 1000) { g.run('update(0.01)'); steps++; }
  if (steps >= 1000) throw new Error('the game never removed a corpse');
  return {
    attackDuration: J('ATK_DUR'),
    impactDelay: J('IMPACT_DELAY'),
    skillDuration: J('SKILL_DUR'),
    skillImpact: J('SKILL_IMPACT'),
    hurtDuration: J('HURT_DUR'),
    corpseLife: Math.round(steps * 10) / 1000,
    muzzle: J('DEFAULT_MUZZLE'),
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
