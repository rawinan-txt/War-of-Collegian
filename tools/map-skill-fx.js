// Maps what every hero's skill effect does today: the top-level fx helper calls made by the game, the particles and the
// visual random draws it consumes. Used to document the effects before a migration and to prove a migration is identical.
//   node tools/map-skill-fx.js [--json out.json]
const fs = require('node:fs');
const { loadGame } = require('../tests/harness');

function mapEffects(opts = {}) {
  const g = loadGame(1, { lazy: true, ...opts }); // fx.js (CHARACTER_FX) is loaded by the harness by default
  g.run('team=["bug"];screen="battle";startBattle(1)');
  const heroes = JSON.parse(g.run('JSON.stringify(heroes.map(h=>({id:h.id,name:h.name,faculty:h.f,stars:h.star,skill:h.skill,description:h.desc,type:h.type})))'));
  const out = {};
  for (const h of heroes) {
    const row = { ...h, mode: g.run(`SKILL_MODE[${JSON.stringify(h.id)}]`) || null, kind: g.run(`(typeof CHARACTER_FX!=='undefined'&&CHARACTER_FX[${JSON.stringify(h.id)}]&&CHARACTER_FX[${JSON.stringify(h.id)}].kind)||(typeof SKILL_FX!=='undefined'&&SKILL_FX[${JSON.stringify(h.id)}]&&SKILL_FX[${JSON.stringify(h.id)}].kind)||null`) };
    for (const level of ['full', 'reduced', 'off']) {
      g.run(`setFxLevel(${JSON.stringify(level)});battle.particles.length=0;battle.shake=0;`);
      const d0 = g.run('battle.rng.vfx.draws'), c0 = g.run('battle.rng.combat.draws');
      g.run(`globalThis.__ops=[];globalThis.__depth=0;
        (function(){const names=['fxBeam','fxBurst','fxRing','fxSpawn','fxShake'],orig={};
          for(const n of names){orig[n]=globalThis[n];}
          for(const n of names){globalThis[n]=function(...a){if(__depth===0)__ops.push([n.slice(2).toLowerCase(),...a]);__depth++;try{return orig[n](...a)}finally{__depth--}}}
          try{runSkillFx({id:${JSON.stringify(h.id)},x:300,y:300,ally:true})}finally{for(const n of names)globalThis[n]=orig[n]}})()`);
      const ops = JSON.parse(g.run('JSON.stringify(__ops)'));
      row[level] = { particles: g.run('battle.particles.length'), vfxDraws: g.run('battle.rng.vfx.draws') - d0, combatDraws: g.run('battle.rng.combat.draws') - c0, shake: g.run('battle.shake'), ops: level === 'full' ? ops : undefined, particleList: level === 'full' ? JSON.parse(g.run('JSON.stringify(battle.particles.map(p=>[p.x,p.y,p.vx,p.vy,p.life,p.color,p.size,p.grav]))')) : undefined };
    }
    out[h.id] = row;
  }
  return out;
}

if (require.main === module) {
  const map = mapEffects();
  const lines = ['| id | name | faculty | skill | mode | fx kind | top-level calls | particles full/reduced/off | visual draws full/reduced/off | combat draws |', '|---|---|---|---|---|---|---|---|---|---|'];
  for (const r of Object.values(map)) {
    const cnt = {};
    for (const o of r.full.ops) cnt[o[0]] = (cnt[o[0]] || 0) + 1;
    lines.push(`| ${r.id} | ${r.name} | ${r.faculty} | ${r.skill} | ${r.mode} | ${r.kind} | ${Object.entries(cnt).map(([k, v]) => `${k}x${v}`).join(' ')} | ${r.full.particles}/${r.reduced.particles}/${r.off.particles} | ${r.full.vfxDraws}/${r.reduced.vfxDraws}/${r.off.vfxDraws} | ${r.full.combatDraws} |`);
  }
  console.log(lines.join('\n'));
  const i = process.argv.indexOf('--json');
  if (i > 0) fs.writeFileSync(process.argv[i + 1], JSON.stringify(map, null, 1));
}
module.exports = { mapEffects };
