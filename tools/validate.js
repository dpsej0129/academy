/* 시나리오·데이터 검증 + 분량 집계 + 무작위 플레이스루(전 분기 엔딩 도달 확인)
 * 사용법: node tools/validate.js [runs=400] [--json]
 */
'use strict';
const { load } = require('./load');
const { Game, GameData: D } = load({ files: undefined });

const runs = +(process.argv[2] || 400);
const errors = [], warns = [];
let script;
try { script = new Game.Script(D); } catch (e) { console.error('파싱 실패:', e.message); process.exit(1); }
const ops = script.ops;

// ---------------------------------------------------------------- 정적 검사
const KNOWN_SPEAKERS = new Set(Object.keys(D.speakers).concat(['도윤', '???', '감독관 인형', '교복 입은 그림자', '교복 입은 누락체', '오델', '오딜', '제국 첩보대장', '제국 요원', '성가대', '장부의 집행관', '개찬된 학생', '감독관 개량형', '검은 기사', '장부', '학생', '사서', '심판', '후배', '공작', '로셰 공작', '1학년', '관중', '목소리', '아이', '교수']));
const unknownSpeakers = {};
const chapterOf = (where) => where.split(':')[0];
const stats = {};
function st(ch) { return (stats[ch] = stats[ch] || { lines: 0, say: 0, narr: 0, sys: 0, chars: 0, choices: 0, options: 0, battles: [] }); }
const labelsUsed = new Set();
ops.forEach((op) => {
  const ch = chapterOf(op.where || op.name.replace('__start_', '') + ':0');
  const s = st(ch);
  if (op.t === 'text') {
    s.lines++; s.chars += op.text.length;
    if (op.style === 'sys') s.sys++; else if (op.name) s.say++; else s.narr++;
    if (op.name && !KNOWN_SPEAKERS.has(op.name)) unknownSpeakers[op.name] = (unknownSpeakers[op.name] || 0) + 1;
  } else if (op.t === 'choice') {
    s.choices++; s.options += op.options.length;
    op.options.forEach((o) => { if (o.target) { labelsUsed.add(o.target); if (script.labels[o.target] === undefined) errors.push(`없는 라벨 ${o.target} (${o.where})`); } });
  } else if (op.t === 'cmd') {
    const a = op.args.split(/\s+/);
    switch (op.cmd) {
      case 'jump': labelsUsed.add(op.args); if (script.labels[op.args] === undefined) errors.push(`없는 라벨 ${op.args} (${op.where})`); break;
      case 'if': { const t = op.args.split('=>')[1].trim(); labelsUsed.add(t); if (script.labels[t] === undefined) errors.push(`없는 라벨 ${t} (${op.where})`); break; }
      case 'battle': if (!D.battles[a[0]]) errors.push(`없는 전투 ${a[0]} (${op.where})`); else s.battles.push(a[0]); break;
      case 'bg': if (!D.backgrounds[a[0]]) errors.push(`없는 배경 ${a[0]} (${op.where})`); break;
      case 'cg': if (a[0] !== 'off' && !D.cgs[a[0]]) errors.push(`없는 CG ${a[0]} (${op.where})`); break;
      case 'show': { const [id, ex] = a[0].split(':'); const c = D.characters[id] || D.npcs[id];
        if (!c) errors.push(`없는 인물 ${id} (${op.where})`); else if (ex && c.expressions.indexOf(ex) < 0) errors.push(`없는 표정 ${id}:${ex} (${op.where})`);
        if (a[1] && !['L', 'C', 'R', 'LL', 'RR'].includes(a[1])) errors.push(`잘못된 위치 ${a[1]} (${op.where})`); break; }
      case 'hide': if (a[0] !== 'all' && !D.characters[a[0]] && !D.npcs[a[0]]) errors.push(`없는 인물 ${a[0]} (${op.where})`); break;
      case 'party': if (!D.characters[a[1]] || !['join', 'leave', 'die', 'away', 'return'].includes(a[0])) errors.push(`잘못된 @party ${op.args} (${op.where})`); break;
      case 'unlock': case 'resolve': if (a[0] !== 'all' && !D.characters[a[0]]) errors.push(`잘못된 대상 ${op.args} (${op.where})`); break;
      case 'cutin': if (!D.characters[a[0]]) errors.push(`컷인 대상 없음 ${a[0]} (${op.where})`); break;
      case 'ending': if (!D.endings[a[0]]) errors.push(`없는 엔딩 ${a[0]} (${op.where})`); break;
      case 'set': case 'scene': case 'fx': case 'chapter': case 'tip': case 'wait': case 'name': case 'clue': case 'shards': case 'save': break;
      default: errors.push(`알 수 없는 명령 @${op.cmd} (${op.where})`);
    }
  }
});
Object.keys(D.battles).forEach((b) => { if (!D.backgrounds[D.battles[b].bg]) errors.push(`전투 ${b}의 배경 ${D.battles[b].bg} 없음`); });
Object.keys(script.labels).forEach((l) => { if (!l.startsWith('__start_') && !labelsUsed.has(l)) warns.push(`사용되지 않는 라벨: ${l}`); });
Object.keys(unknownSpeakers).forEach((n) => warns.push(`등록되지 않은 화자 '${n}' ×${unknownSpeakers[n]} (나레이션이 잘못 파싱됐을 수 있음)`));

// ---------------------------------------------------------------- 무작위 플레이스루
function rng(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), t | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const visited = new Set();
const endings = {};
const perRun = [];
function playthrough(pick) {
  const story = new Game.Story(script, Game.newState('normal'), D);
  let lines = 0, chars = 0, battles = 0, bosses = 0, choices = 0, guard = 0;
  while (guard++ < 100000) {
    visited.add(story.state.pos);
    const r = story.run();
    visited.add(story.state.pos);
    if (r.type === 'text') { lines++; chars += r.op.text.length; story.advance(); continue; }
    if (r.type === 'choice') { choices++; const o = pick(r.options, r.op); story.choose(o); continue; }
    if (r.type === 'battle') {
      battles++; if (D.battles[r.id].tier === 'boss') bosses++;
      const avail = story.availableFor(r.id);
      const forced = (D.battles[r.id].forced || []);
      forced.forEach((f) => { if (avail.indexOf(f) < 0) errors.push(`필수 출전 ${f}이(가) 없는 상태로 전투 ${r.id} 진입`); });
      if (!avail.length) errors.push(`출전 가능 인원 0명: ${r.id}`);
      story.resume(); continue;
    }
    if (r.type === 'ending') { endings[r.id] = (endings[r.id] || 0) + 1; return { ending: r.id, lines, chars, battles, bosses, choices, state: story.state }; }
    if (r.type === 'end') { errors.push('엔딩 없이 스크립트 종료'); return null; }
    story.resume();
  }
  errors.push('플레이스루가 끝나지 않음');
  return null;
}
const strategies = [];
// 트루 엔딩 루트: 선택지의 점프 대상 라벨로 고른다
const TRUE_ROUTE = ['p_viv_polite', 'c1_mir_warm', 'c1_ball_apology', 'c1_team', 'c1_name_finn', 'c2_kai_keep', 'c2_mirror_touch',
  'c2_registry', 'c2_jul_ally', 'c3_watch_kai', 'c3_rol_trust', 'c3_eleanor', 'c3_ser_hand', 'c4_hester_name', 'c4_mir_truth',
  'c4_dance_viv', 'c4_go_roland', 'c5_promise_names', 'c5_name_kang', 'c5_rewrite'];
function routeBy(prefer) { return (o) => o.find((x) => prefer.includes(x.target)) || o[0]; }
strategies.push(['true(롤랑에게 맡김)', routeBy(TRUE_ROUTE)]);
strategies.push(['true(시계탑, 카이엔 사망)', routeBy(TRUE_ROUTE.map((t) => t === 'c4_go_roland' ? 'c4_go_tower' : t).concat(['c3_watch_ser', 'c4_dance_ser']))]);
strategies.push(['true(거짓말, 롤랑 폭로)', routeBy(TRUE_ROUTE.map((t) => ({ c4_mir_truth: 'c4_mir_lie', c3_rol_trust: 'c3_rol_expose', c4_go_roland: 'c4_go_tower', c4_dance_viv: 'c4_dance_kai' })[t] || t))]);
strategies.push(['rewrite 실패(이름 4개)', routeBy(TRUE_ROUTE.map((t) => t === 'c3_eleanor' ? 'c3_blueprint' : t))]);
strategies.push(['rewrite 실패(세라핀 납치)', routeBy(TRUE_ROUTE.map((t) => t === 'c4_go_roland' ? 'c4_go_dorm' : t))]);
strategies.push(['배신·거짓말 루트', routeBy(['p_viv_rude', 'c1_mir_cold', 'c1_ball_mock', 'c1_duel', 'c1_noname_finn', 'c2_kai_report', 'c2_mirror_turn', 'c2_tea', 'c2_jul_crush', 'c3_watch_rol', 'c3_rol_ignore', 'c3_blueprint', 'c3_read_more', 'c4_hester_skip', 'c4_mir_lie', 'c4_dance_kai', 'c4_go_tower', 'c5_promise_live', 'c5_name_none', 'ep_normal'])]);
strategies.push(['폭로 루트', routeBy(['c3_rol_expose', 'c3_watch_mir', 'c4_dance_mir', 'c5_name_ardin', 'c5_name_doyun', 'ep_bad'])]);
strategies.push(['first', (o) => o[0]]);
strategies.push(['last', (o) => o[o.length - 1]]);
for (let i = 0; i < runs; i++) { const r = rng(i + 1); strategies.push(['random' + i, (o) => o[Math.floor(r() * o.length)]]); }
const named = {};
strategies.forEach(([name, fn]) => {
  try { const res = playthrough(fn); if (res) { perRun.push(res); if (!name.startsWith('random')) named[name] = res; } }
  catch (e) { errors.push(name + ': ' + e.message); }
});
const textOps = ops.map((o, i) => [o, i]).filter(([o]) => o.t === 'text');
const unvisited = textOps.filter(([, i]) => !visited.has(i));

// ---------------------------------------------------------------- 출력
const order = D.scenarioOrder;
let tot = { lines: 0, say: 0, narr: 0, sys: 0, chars: 0, choices: 0, options: 0, battles: 0 };
console.log('\n장별 분량');
console.log('장\t\t전체줄\t대사\t나레이션\t상태창\t글자\t선택지\t전투');
order.forEach((k) => {
  const s = st(k);
  tot.lines += s.lines; tot.say += s.say; tot.narr += s.narr; tot.sys += s.sys; tot.chars += s.chars; tot.choices += s.choices; tot.options += s.options; tot.battles += s.battles.length;
  console.log(`${k.padEnd(10)}\t${s.lines}\t${s.say}\t${s.narr}\t\t${s.sys}\t${s.chars}\t${s.choices}\t${s.battles.length}`);
});
console.log(`합계      \t${tot.lines}\t${tot.say}\t${tot.narr}\t\t${tot.sys}\t${tot.chars}\t${tot.choices}(${tot.options}지)\t${tot.battles}`);
const allBattles = new Set(); order.forEach((k) => st(k).battles.forEach((b) => allBattles.add(b)));
const bossIds = [...allBattles].filter((b) => D.battles[b].tier === 'boss');
console.log(`\n시나리오에 배치된 전투 ${allBattles.size}종 (보스 ${bossIds.length}종: ${bossIds.join(', ')})`);
const unusedBattles = Object.keys(D.battles).filter((b) => !allBattles.has(b));
if (unusedBattles.length) warns.push('시나리오에서 쓰이지 않는 전투: ' + unusedBattles.join(', '));
if (perRun.length) {
  const avg = (k) => (perRun.reduce((a, r) => a + r[k], 0) / perRun.length);
  const mn = (k) => Math.min(...perRun.map((r) => r[k])), mx = (k) => Math.max(...perRun.map((r) => r[k]));
  console.log(`\n플레이스루 ${perRun.length}회: 엔딩 분포 ${JSON.stringify(endings)}`);
  console.log(`1회당 표시 줄 수 평균 ${avg('lines').toFixed(0)} (최소 ${mn('lines')}, 최대 ${mx('lines')}), 글자 ${avg('chars').toFixed(0)}`);
  console.log(`1회당 전투 평균 ${avg('battles').toFixed(1)} (최소 ${mn('battles')}, 최대 ${mx('battles')}), 보스 ${avg('bosses').toFixed(1)}, 선택 ${avg('choices').toFixed(1)}회`);
  Object.keys(named).forEach((n) => console.log(`  [${n}] 엔딩=${named[n].ending} 줄=${named[n].lines} 전투=${named[n].battles} 보스=${named[n].bosses} 이름=${named[n].state.names.length} 파티=${named[n].state.party.members.join('/')}`));
  if (!named['true(롤랑에게 맡김)'] || named['true(롤랑에게 맡김)'].ending !== 'true') errors.push('트루 엔딩 루트가 트루 엔딩에 도달하지 못함');
  if (!named['rewrite 실패(이름 4개)'] || named['rewrite 실패(이름 4개)'].ending !== 'normal') errors.push('이름 4개로 다시 쓰기가 실패하지 않음');
  if (!named['rewrite 실패(세라핀 납치)'] || named['rewrite 실패(세라핀 납치)'].ending !== 'normal') errors.push('세라핀 납치 상태로 다시 쓰기가 실패하지 않음');
}
console.log(`\n방문하지 못한 대사 ${unvisited.length}줄` + (unvisited.length ? ': ' + unvisited.slice(0, 8).map(([o]) => o.where).join(', ') + (unvisited.length > 8 ? ' …' : '') : ''));
if (warns.length) { console.log('\n경고'); warns.slice(0, 40).forEach((w) => console.log('  - ' + w)); }
if (errors.length) { console.log('\n오류'); [...new Set(errors)].slice(0, 40).forEach((e) => console.log('  ✗ ' + e)); process.exit(1); }
console.log('\n검증 통과');
module.exports = { stats, tot };
