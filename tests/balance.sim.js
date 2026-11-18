// Run: node tests/balance.sim.js   (prints win rate per team x ultimate)
const { loadGame } = require('./harness');

const TEAMS = {
  mixed: ['bug', 'mecha', 'lab', 'night', 'animal', 'music'],
  allTank: ['mecha', 'public', 'dental', 'runner', 'animal', 'night'],
  allRanged: ['bug', 'lab', 'chem', 'music', 'night', 'nurse'],
  healthcare: ['night', 'chem', 'nurse', 'public', 'dental', 'mecha'],
  campus: ['music', 'runner', 'global', 'bug', 'mecha', 'night'],
  random: ['global', 'dental', 'bug', 'animal', 'public', 'lab'],
};

function simulate(teamIds, ult, seed = 1) {
  const g = loadGame(seed);
  g.run(`team=${JSON.stringify(teamIds)};ultType='${ult}';startBattle()`);
  // Bot: rotate through cards (skip cards on cooldown, wait for AT otherwise) so every card gets used.
  g.run('var botIdx=0');
  for (let i = 0; i < 6000 && !g.run('battle.ended'); i++) {
    g.run(`(()=>{if(battle.level<3&&battle.at>=battle.upgrade)upgradeIncome();
      const id=team[botIdx%team.length],h=heroes.find(x=>x.id===id);
      if(battle.cd[id]>0)botIdx++;else if(battle.at>=h.cost){deploy(id);botIdx++}
      useUltimate();
      if(battle.baseCd<=0&&battle.enemies.length>=3)baseSkill();
      update(0.05)})()`);
  }
  return {
    win: g.run('battle.enemyHp<=0'),
    time: g.run('battle.t'),
    baseHp: g.run('Math.max(0,battle.baseHp)'),
  };
}

if (require.main === module) {
  const SEEDS = [1, 2, 3, 4, 5];
  console.log('team'.padEnd(12), ...['wifi', 'rain', 'shuttle'].map((u) => u.padEnd(14)));
  for (const [name, ids] of Object.entries(TEAMS)) {
    const cells = ['wifi', 'rain', 'shuttle'].map((u) => {
      const rs = SEEDS.map((s) => simulate(ids, u, s));
      const wins = rs.filter((r) => r.win).length;
      const avg = Math.round(rs.reduce((a, r) => a + r.time, 0) / rs.length);
      const hp = Math.round(rs.reduce((a, r) => a + r.baseHp, 0) / rs.length);
      return `${wins}/${SEEDS.length} ${avg}s hp${hp}`.padEnd(18);
    });
    console.log(name.padEnd(12), ...cells);
  }
}

module.exports = { simulate, TEAMS };
