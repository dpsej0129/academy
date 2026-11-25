/* 플레이 시간 추정기
 * 추정식: (표시되는 대사 줄 수 × 줄당 읽기 시간) + Σ(전투별 평균 턴 수 × 턴당 시간) + 편성 화면 시간
 *  - 줄 수: 무작위 플레이스루 200회의 장별 평균 (실제로 화면에 표시되는 줄만 센다)
 *  - 줄당 읽기 시간: 평균 글자 수 ÷ 초당 12자 + 클릭 0.4초
 *  - 전투 턴 수: 보통 난이도·단련 1단계 자동 전투 시뮬레이션 평균 (사람이 직접 하면 비슷하거나 약간 짧다)
 *  - 턴당 시간: 계획 12초 + 1배속 연출 13초 = 25초, 편성 화면 10초
 * 사용법: node tools/playtime.js [턴당 초=25]   (전투 2배속·자동 위주라면 18 정도) */
'use strict';
const { load } = require('./load');
const { Game, GameData: D } = load();
const { run, PARTY } = require('./battle_sim');

const CPS = 12, CLICK = 0.4, TURN_SEC = +(process.argv[2] || 25), FORM_SEC = 10;
const script = new Game.Script(D);

function rng(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), t | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

// 전투별 평균 턴
const turns = {};
Object.keys(D.battles).forEach((bid) => {
  let t = 0; const N = 30;
  for (let i = 0; i < N; i++) t += run(bid, 7000 + i * 31, 'normal', 1, true).turns;
  turns[bid] = t / N;
});

const RUNS = 200;
const acc = {};
D.scenarioOrder.forEach((k) => (acc[k] = { lines: 0, chars: 0, battleSec: 0, battles: 0 }));
for (let r = 0; r < RUNS; r++) {
  const pick = rng(r + 99);
  const story = new Game.Story(script, Game.newState('normal'), D);
  let guard = 0;
  while (guard++ < 100000) {
    const res = story.run();
    const ch = story.state.chapter;
    if (res.type === 'text') { acc[ch].lines++; acc[ch].chars += res.op.text.length; story.advance(); continue; }
    if (res.type === 'choice') { story.choose(res.options[Math.floor(pick() * res.options.length)]); continue; }
    if (res.type === 'battle') { acc[ch].battles++; acc[ch].battleSec += turns[res.id] * TURN_SEC + FORM_SEC; story.resume(); continue; }
    if (res.type === 'ending' || res.type === 'end') break;
    story.resume();
  }
}
const names = { prologue: '프롤로그', ch1: '1장', ch2: '2장', ch3: '3장', ch4: '4장', ch5: '5장', epilogue: '에필로그' };
let tot = { lines: 0, read: 0, battle: 0, battles: 0 };
const rows = [];
D.scenarioOrder.forEach((k) => {
  const a = acc[k];
  const lines = a.lines / RUNS, chars = a.chars / RUNS;
  const read = (chars / CPS + lines * CLICK) / 60;
  const battle = a.battleSec / RUNS / 60;
  tot.lines += lines; tot.read += read; tot.battle += battle; tot.battles += a.battles / RUNS;
  rows.push({ 장: names[k], '표시 줄': lines.toFixed(0), '읽기(분)': read.toFixed(1), 전투: (a.battles / RUNS).toFixed(1), '전투(분)': battle.toFixed(1), '합계(분)': (read + battle).toFixed(1) });
});
rows.push({ 장: '합계', '표시 줄': tot.lines.toFixed(0), '읽기(분)': tot.read.toFixed(1), 전투: tot.battles.toFixed(1), '전투(분)': tot.battle.toFixed(1), '합계(분)': (tot.read + tot.battle).toFixed(1) });
console.table(rows);
console.log('전투별 평균 턴(보통, 단련 1):', Object.entries(turns).map(([k, v]) => `${k}=${v.toFixed(1)}`).join(' '));
