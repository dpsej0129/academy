/* 전투 엔진 단위 테스트: node tests/engine.test.js */
'use strict';
const assert = require('assert');
const { load } = require('../tools/load');
const { Game, GameData } = load({ files: ['js/engine.js', 'js/battle.js', 'data/characters.js', 'data/enemies.js', 'data/battles.js'] });

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('  ✓ ' + name); }
function mk(bid, party, seed) {
  return new Game.Battle(bid, { party: party.map((id) => ({ id })), seed: seed || 1 });
}

test('같은 시드면 같은 결과 (결정론)', () => {
  const runOnce = () => { const b = mk('p_b2', ['lennox', 'kaien', 'seraphine', 'vivienne'], 42); const log = [];
    while (!b.result && b.turn < 30) { b.startTurn(); b.autoPlan(); log.push(JSON.stringify(b.resolveTurn())); } return log.join(); };
  assert.strictEqual(runOnce(), runOnce());
});

test('격돌: 진 쪽은 등불을 하나씩 잃고, 먼저 다 잃은 쪽이 맞는다', () => {
  const b = mk('p_b1', ['lennox', 'kaien'], 7);
  b.startTurn();
  const ea = b.enemyActions[0];
  const ally = b.unit(ea.target);
  b.setPlan(ally.uid, { skill: ally.hand[0], target: { uid: ea.uid, die: ea.die } });
  const ev = b.resolveTurn();
  const rounds = ev.filter((e) => e.t === 'clashRound');
  assert.ok(rounds.length >= 1, '격돌 라운드가 있어야 함');
  rounds.forEach((r) => { if (r.loser === 'a') assert.ok(r.ap < r.bp || r.round > 12); if (r.loser === 'b') assert.ok(r.bp < r.ap || r.round > 12); });
  const end = ev.find((e) => e.t === 'clashEnd');
  const last = rounds[rounds.length - 1];
  assert.ok(last.alamps === 0 || last.blamps === 0, '한쪽 등불이 0이어야 종료');
  const hits = ev.filter((e) => e.t === 'hit' && e.uid === end.winner);
  assert.ok(hits.length >= 1, '승자가 공격해야 함');
});

test('가로채기: 더 빠른 아군은 다른 아군을 노린 공격과 격돌한다', () => {
  for (let seed = 1; seed < 200; seed++) {
    const b = mk('p_b1', ['lennox', 'kaien'], seed);
    b.startTurn();
    const len = b.allies().find((u) => u.id === 'lennox');
    const ea = b.enemyActions.find((a) => a.target !== len.uid && len.dice[0].speed > a.speed);
    if (!ea) continue;
    b.setPlan(len.uid, { skill: len.hand[0], target: { uid: ea.uid, die: ea.die } });
    assert.strictEqual(b.preview(len.uid).mode, 'intercept');
    const ev = b.resolveTurn();
    assert.ok(ev.some((e) => e.t === 'intercept' && e.uid === len.uid));
    return;
  }
  assert.fail('가로채기 상황을 찾지 못함');
});

test('느린 아군은 일방 공격이 된다', () => {
  for (let seed = 1; seed < 300; seed++) {
    const b = mk('p_b1', ['lennox', 'kaien'], seed);
    b.startTurn();
    const kai = b.allies().find((u) => u.id === 'kaien');
    const ea = b.enemyActions.find((a) => a.target !== kai.uid && kai.dice[0].speed <= a.speed);
    if (!ea) continue;
    b.setPlan(kai.uid, { skill: kai.hand[0], target: { uid: ea.uid, die: ea.die } });
    assert.strictEqual(b.preview(kai.uid).mode, 'onesided');
    return;
  }
  assert.fail('일방 공격 상황을 찾지 못함');
});

test('자세 붕괴: 구간을 넘으면 다음 턴 행동 불가, 받는 피해 증가', () => {
  const b = mk('p_b2', ['lennox', 'kaien', 'seraphine', 'vivienne'], 3);
  const dog = b.enemies()[0];
  b.startTurn();
  const ev = [];
  b._damage(dog, dog.hp - dog.breaks[0] + 1, null, ev, 'hit');
  assert.ok(ev.some((e) => e.t === 'break'));
  assert.strictEqual(dog.brokenUntil, b.turn + 1);
  b.resolveTurn();
  b.startTurn();
  assert.strictEqual(dog.dice.length, 0, '붕괴 중에는 주사위가 없다');
  const ev2 = b.resolveTurn();
  assert.ok(ev2.some((e) => e.t === 'recover' && e.uid === dog.uid), '턴 끝에 회복');
});

test('심지: -45~+45 범위, -40 이하이면 공황', () => {
  const b = mk('p_b1', ['lennox', 'kaien'], 2);
  const len = b.allies()[0];
  const ev = [];
  b.changeResolve(len, -999, ev);
  assert.strictEqual(len.resolve, -45);
  b.changeResolve(len, 999, ev);
  assert.strictEqual(len.resolve, 45);
  len.resolve = -41;
  const sev = b.startTurn();
  assert.ok(len.panic && sev.some((e) => e.t === 'panic'));
  assert.ok(b.plans[len.uid] && b.plans[len.uid].auto, '공황 아군은 자동 행동');
  assert.ok(b.lampProb({ resolve: 45, mods: {} }) > b.lampProb({ resolve: -45, mods: {} }));
});

test('화음: 같은 속성 2장 이상이면 위력 보너스, 무색은 합류', () => {
  const b = mk('p_b2', ['lennox', 'kaien', 'seraphine', 'vivienne'], 9);
  b.startTurn();
  const [len, kai, ser] = b.allies();
  const plans = {};
  plans[len.uid] = { skill: 'len_s1', target: { uid: 'x', die: 0 } };
  plans[ser.uid] = { skill: 'ser_s1', target: { uid: 'x', die: 0 } };
  plans[kai.uid] = { skill: 'kai_s1', target: { uid: 'x', die: 0 } };
  const h = b.computeHarmony(plans);
  assert.strictEqual(h.bonus[len.uid], 1);
  assert.strictEqual(h.bonus[ser.uid], 1);
});

test('부위: 부위가 살아있으면 본체 피해 감소, 부위 파괴 시 해제', () => {
  const b = mk('c1_b4', ['lennox', 'kaien'], 4);
  const core = b.enemies().find((u) => u.id === 'warden');
  assert.strictEqual(core.parts.length, 2);
  b.startTurn();
  const len = b.allies()[0];
  const sk = GameData.skills.len_s1;
  const ev = [];
  const hp0 = core.hp;
  b._attack(len, sk, core, 1, {}, false, ev);
  const shielded = hp0 - core.hp;
  core.parts.forEach((pid) => b._kill(b.unit(pid), len, []));
  const hp1 = core.hp;
  len.resolve = 45;
  b._attack(len, sk, core, 1, {}, false, []);
  assert.ok(hp1 - core.hp > shielded, '부위 파괴 후 더 큰 피해');
});

test('잿빛 왕은 한 번 컨티뉴한다', () => {
  const b = mk('c5_b4', ['lennox'], 5);
  const k = b.enemies()[0];
  const ev = [];
  b._damage(k, k.hp + 10, null, ev, 'hit');
  assert.ok(!k.dead && k.revived && ev.some((e) => e.t === 'phase'));
  b._damage(k, k.hp + 10, null, ev, 'hit');
  assert.ok(k.dead);
});

test('장부의 기록 봉인: 가장 많이 쓴 기술이 봉인된다', () => {
  const b = mk('c5_b5', ['lennox', 'vivienne'], 6);
  b.startTurn();
  const len = b.allies()[0];
  len.usage = { len_s1: 3, len_s2: 1 };
  b.resolveTurn();
  const ev = b.startTurn();
  assert.ok(ev.some((e) => e.t === 'seal' && e.skill === 'len_s1'));
  assert.ok(len.hand.indexOf('len_s1') < 0, '봉인된 기술은 손에 없다');
});

test('모든 전투가 자동 전투로 끝까지 진행된다 (무한 루프 없음)', () => {
  Object.keys(GameData.battles).forEach((bid) => {
    const def = GameData.battles[bid];
    const party = (def.fixed || ['lennox', 'vivienne', 'kaien', 'mireille']).slice(0, def.maxParty || 4);
    const b = mk(bid, party, 11);
    let n = 0;
    while (!b.result && n++ < 80) { b.startTurn(); b.autoPlan(); b.resolveTurn(); }
    assert.ok(b.result, bid + ' 결과 없음');
  });
});

test('표정 시트: 표정 수별 배치와 칸 좌표', () => {
  const A = Game.Assets;
  assert.deepStrictEqual(A.sheetLayout(3), { cols: 3, rows: 1 });
  assert.deepStrictEqual(A.sheetLayout(4), { cols: 2, rows: 2 });
  assert.deepStrictEqual(A.sheetLayout(5), { cols: 3, rows: 2 });
  assert.deepStrictEqual(A.sheetLayout(6), { cols: 3, rows: 2 });
  // 3x2 시트(2160x2560)의 5번째 표정(index 4) = 2행 2열
  const r = A.cellRect(2160, 2560, A.sheetLayout(5), 4, 'full');
  assert.deepStrictEqual(r, { sx: 720, sy: 1280, sw: 720, sh: 1280 });
  // 2x2 시트의 3번째(index 2) = 2행 1열
  const r2 = A.cellRect(1440, 2560, A.sheetLayout(4), 2, 'full');
  assert.deepStrictEqual([r2.sx, r2.sy], [0, 1280]);
  // 초상화는 첫 칸 위쪽 중앙의 정사각형
  const b = A.cellRect(2160, 2560, A.sheetLayout(5), 0, 'bust');
  assert.ok(b.sw === b.sh && b.sx > 0 && b.sx + b.sw < 720 && b.sy < 1280 * 0.1);
  // 모든 인물의 표정 수가 시트 칸 안에 들어간다
  Object.values(GameData.characters).concat(Object.values(GameData.npcs)).forEach((c) => {
    const l = A.sheetLayout(c.expressions.length);
    assert.ok(l.cols * l.rows >= c.expressions.length && c.expressions.length >= 3, c.name);
  });
});

console.log(`\n${passed}개 테스트 통과`);
