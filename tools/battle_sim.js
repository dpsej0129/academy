/* 전투 밸런스 시뮬레이터
 * 사용법: node tools/battle_sim.js [battleId|all] [runs=60] [difficulty=normal] [upgrade=0]
 * 자동 편성 AI(autoPlan)로 전투를 반복해 승률·평균 턴·생존 체력을 출력한다.
 */
'use strict';
const { load } = require('./load');
const FILES = ['js/engine.js', 'js/battle.js', 'data/characters.js', 'data/enemies.js', 'data/battles.js'];
const { Game, GameData } = load({ files: FILES });

// 장별로 '최악에 가까운' 편성(이탈·사망 가능성을 고려)
const PARTY = {
  p_b1: ['lennox', 'kaien'],
  p_b2: ['lennox', 'kaien', 'seraphine', 'vivienne'],
  c1_b1: ['lennox', 'kaien'],
  c1_b2: ['lennox', 'kaien'],
  c1_b3: ['lennox', 'mireille', 'kaien'],
  c1_b4: ['lennox', 'kaien', 'mireille', 'vivienne'],
  c2_b1: ['lennox', 'vivienne', 'mireille'],
  c2_b2: ['lennox', 'vivienne', 'roland'],
  c2_b3: ['lennox', 'vivienne', 'roland', 'mireille'],
  c2_b4: ['lennox', 'vivienne', 'mireille'],
  c3_b1: ['lennox', 'vivienne', 'kaien', 'mireille'],
  c3_b2: ['lennox', 'vivienne', 'kaien', 'mireille'],
  c3_b3a: ['lennox', 'roland', 'kaien', 'mireille'],
  c3_b3b: ['lennox', 'vivienne', 'kaien', 'mireille'],
  c3_b4: ['lennox', 'vivienne', 'kaien', 'seraphine'],
  c3_b5: ['lennox', 'vivienne', 'kaien', 'mireille'],
  c4_b1: ['lennox', 'vivienne', 'kaien', 'mireille'],
  c4_b2: ['lennox', 'vivienne', 'kaien', 'seraphine'],
  c4_b3: ['lennox', 'vivienne', 'kaien', 'seraphine'],
  c4_b4a: ['lennox', 'kaien', 'vivienne', 'mireille'],
  c4_b4b: ['lennox', 'vivienne', 'mireille', 'roland'],
  c4_b5: ['lennox', 'vivienne', 'seraphine', 'mireille'],
  c5_b1: ['lennox', 'vivienne', 'seraphine', 'roland'],
  c5_b2: ['lennox', 'vivienne', 'seraphine', 'roland'],
  c5_b3: ['lennox', 'vivienne', 'kaien', 'mireille'],
  c5_b4: ['lennox', 'vivienne', 'seraphine', 'mireille'],
  c5_b5: ['lennox', 'vivienne', 'seraphine', 'mireille']
};

function engFor(id, level) {
  const tier = level >= 4 ? 3 : level >= 3 ? 2 : level >= 2 ? 1 : 0;
  if (!tier) return null;
  return GameData.characters[id].engravings[Math.min(tier, 3) - 1];
}

function run(bid, seed, diff, upgrade, useEng) {
  const def = GameData.battles[bid];
  const party = (PARTY[bid] || def.fixed || ['lennox']).map((id) => ({
    id, upgrade, engraving: useEng ? engFor(id, def.level) : null
  }));
  const b = new Game.Battle(bid, { party, seed, difficulty: diff, check: () => false });
  let guard = 0;
  while (!b.result && guard++ < 60) {
    b.startTurn();
    b.autoPlan();
    b.resolveTurn();
  }
  const allies = b.allies();
  const hpPct = allies.reduce((s, u) => s + u.hp / u.maxHp, 0) / allies.length;
  return { win: b.result === 'win', turns: b.turn, hpPct, dead: allies.filter((u) => u.dead).length, cw: b.stats.clashWin, cl: b.stats.clashLose };
}

function main() {
  const which = process.argv[2] || 'all';
  const runs = +(process.argv[3] || 60);
  const diff = process.argv[4] || 'normal';
  const upgrade = +(process.argv[5] || 0);
  const useEng = process.argv[6] !== 'noeng';
  const ids = which === 'all' ? Object.keys(GameData.battles) : which.split(',');
  const rows = [];
  for (const bid of ids) {
    let w = 0, t = 0, hp = 0, dead = 0, cw = 0, cl = 0;
    for (let i = 0; i < runs; i++) {
      const r = run(bid, 1000 + i * 17, diff, upgrade, useEng);
      if (r.win) w++;
      t += r.turns; hp += r.hpPct; dead += r.dead; cw += r.cw; cl += r.cl;
    }
    rows.push({ bid, tier: GameData.battles[bid].tier, win: (w / runs * 100).toFixed(0) + '%', turns: (t / runs).toFixed(1),
      hp: (hp / runs * 100).toFixed(0) + '%', dead: (dead / runs).toFixed(2), clashWin: (cw / Math.max(1, cw + cl) * 100).toFixed(0) + '%' });
  }
  console.log(`difficulty=${diff} runs=${runs} upgrade=${upgrade} engravings=${useEng}`);
  console.table(rows);
  return rows;
}

if (require.main === module) main();
module.exports = { run, PARTY };
