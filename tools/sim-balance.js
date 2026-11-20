// Deterministic balance simulation: fixed teams x seeds x stages, played by one simple but sensible policy.
// Read-only for the game (headless harness). Usage: node tools/sim-balance.js [stage ...] [--seeds N] [--out file.json]
// The policy: keep deploying the ready hero with the fewest units alive, upgrade income early, fire the laser when 2+ enemies are alive,
// use the ultimate as soon as it is ready. It does not know the future, so results are a baseline, not a guarantee.
const fs = require('node:fs');
const path = require('node:path');
const { loadGame } = require('../tests/harness');

const TEAMS = {
  mixed: ['bug', 'mecha', 'night', 'lab', 'chem', 'dental'],
  support: ['bug', 'animal', 'music', 'runner', 'global', 'nurse'],
  tanky: ['bug', 'public', 'night', 'lab', 'mecha', 'chem'],
  lowstar: ['bug', 'mecha', 'lab', 'night', 'chem', 'animal'],
  rangedHeavy: ['bug', 'lab', 'chem', 'music', 'global', 'night'],
  tankHeavy: ['mecha', 'public', 'dental', 'runner', 'night', 'lab'],
  supportHeavy: ['night', 'nurse', 'animal', 'music', 'public', 'bug'],
  balanced: ['bug', 'mecha', 'night', 'lab', 'dental', 'public'],
};

function play(stageNo, teamName, seed, step = 0.05, policy = "fewest") {
  const team = TEAMS[teamName] || teamName;
  const g = loadGame(seed, { lazy: true, enemies: true });
  g.run(`team=${JSON.stringify(team)};screen='battle';stage=${stageNo};startBattle(${seed})`);
  if (policy === "auto") g.run("AUTO.on=true");
  g.run('globalThis.__sp={};{const o=spawnEnemy;spawnEnemy=function(t){__sp[t]=(__sp[t]||0)+1;return o(t)}}');
  let t = 0, nextDecision = 0, maxUnits = 0;
  for (let i = 0; i < 6200 && !g.run('battle.ended'); i++) {
    if (policy !== "auto" && t >= nextDecision) {
      nextDecision = t + 0.25;
      g.run(`(function(){const b=battle;
        if(b.baseCd<=0&&b.enemies.filter(e=>e.alive).length>=2)baseSkill();
        if(b.ult>=100)useUltimate();
        if(b.level<4&&b.at>=b.upgrade+60)upgradeIncome();
        const ready=team.filter(id=>{const h=heroes.find(x=>x.id===id);return b.cd[id]<=0&&b.at>=h.cost});
        ${policy==="cheap"?"ready.sort((p,q)=>heroes.find(x=>x.id===p).cost-heroes.find(x=>x.id===q).cost);":"ready.sort((p,q)=>b.units.filter(u=>u.id===p&&u.alive).length-b.units.filter(u=>u.id===q&&u.alive).length);"}
        if(ready.length&&b.units.length<30)deploy(ready[0]);
      })()`);
    }
    g.run(`update(${step})`);
    maxUnits = Math.max(maxUnits, g.run('battle.units.length'));
    t += step;
  }
  const o = JSON.parse(g.run(`JSON.stringify({win:battle.enemyHp<=0&&battle.baseHp>0,t:+battle.t.toFixed(1),base:Math.max(0,Math.round(battle.baseHp)),enemyBase:Math.round(Math.max(0,battle.enemyHp)),kills:battle.kills,level:battle.level,deployed:battle.deployed,bossSpawned:battle.bossSpawned,bossDead:battle.bossDead,spawns:__sp,
    dmg:Math.round(CombatStats.getAllCharacterStats().reduce((a,r)=>a+r.totalDamage,0)),def:Math.round(CombatStats.getAllCharacterStats().reduce((a,r)=>a+r.totalDefense,0)),heal:Math.round(CombatStats.getAllCharacterStats().reduce((a,r)=>a+r.totalHealing,0))})`));
  o.maxUnits = maxUnits;
  return o;
}

function summarize(runs) {
  const n = runs.length, avg = (k) => Math.round((runs.reduce((a, r) => a + r[k], 0) / n) * 10) / 10;
  const wins = runs.filter((r) => r.win);
  return { runs: n, winRate: Math.round((100 * wins.length) / n), avgTime: avg('t'), avgBaseHp: avg('base'), avgKills: avg('kills'), avgDmg: avg('dmg'), avgDef: avg('def'), avgHeal: avg('heal'), avgLevel: avg('level'), bossReached: Math.round((100 * runs.filter((r) => r.bossSpawned).length) / n), bossKilled: Math.round((100 * runs.filter((r) => r.bossDead).length) / n) };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const seedsN = +(args[args.indexOf('--seeds') + 1] || 10);
  const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
  const stages = args.filter((a, i) => /^\d+$/.test(a) && args[i - 1] !== '--seeds').map(Number);
  const result = {};
  for (const st of stages.length ? stages : [1, 2]) {
    result[st] = {};
    for (const team of Object.keys(TEAMS)) {
      const runs = [];
      for (let s = 1; s <= seedsN; s++) runs.push(play(st, team, 100 * st + s));
      result[st][team] = { summary: summarize(runs), runs };
      const m = result[st][team].summary;
      console.log(`stage ${st} ${team.padEnd(13)} win ${String(m.winRate).padStart(3)}%  time ${m.avgTime}s  base ${m.avgBaseHp}  boss reached ${m.bossReached}% killed ${m.bossKilled}%`);
    }
    const all = Object.values(result[st]).flatMap((x) => x.runs);
    result[st].ALL = { summary: summarize(all) };
    console.log(`stage ${st} ALL           win ${result[st].ALL.summary.winRate}%`);
  }
  if (out) fs.writeFileSync(path.resolve(out), JSON.stringify(result, null, 1));
}
module.exports = { play, summarize, TEAMS };
