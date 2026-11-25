/* 전투 엔진 — DOM과 분리된 순수 로직.
 * 흐름: startTurn() → (플레이어) setPlan()/autoPlan() → resolveTurn() → 이벤트 배열을 UI가 재생.
 *
 * 용어: 속도 주사위 / 격돌(합) / 등불(코인) / 심지(정신력) / 자세 붕괴(흐트러짐) / 화음(공명) / 잔광·극의(궁극기)
 */
(function (root) {
  'use strict';
  var G = root.Game = root.Game || {};
  var U = G.util;

  var C = G.BattleRules = {
    RES_MIN: -45, RES_MAX: 45,
    PANIC_AT: -40,          // 심지가 이 값 이하로 턴을 시작하면 공황
    PANIC_RESET: -10,       // 공황 턴이 끝나면 심지가 이 값으로 회복
    LAMP_PER_RES: 0.009,    // 심지 1당 등불 점화 확률 변화 (+45 → 90.5%)
    GLOW_MAX: 100,          // 극의 비용
    GLOW_CLASH_WIN: 15,
    GLOW_HIT_TAKEN: 4,
    GLOW_HARMONY: 6,
    BROKEN_TAKEN: 1.5,      // 자세 붕괴 중 받는 피해 배율
    PANIC_TAKEN: 1.2,
    WEAK: 1.0,              // 속성 배율은 적 데이터의 resist 값을 그대로 사용
    CLASH_WIN_RES: 3,       // 격돌 승리 심지 (+격돌 횟수, 최대 +5)
    CLASH_LOSE_RES: -2,
    ALLY_DEATH_RES: -10,
    ENEMY_KILL_RES: 3
  };

  function D() { return root.GameData; }

  function skillDef(id) {
    var d = D();
    var s = d.skills[id] || d.enemySkills[id] || null;
    if (s && !s.id) s.id = id;
    return s;
  }

  // ---------------------------------------------------------------- 생성
  function Battle(battleId, opts) {
    var d = D();
    opts = opts || {};
    this.id = battleId;
    this.def = d.battles[battleId];
    if (!this.def) throw new Error('알 수 없는 전투: ' + battleId);
    this.rng = opts.rng || new G.RNG(opts.seed);
    this.diffKey = opts.difficulty || 'normal';
    this.diff = d.difficulty[this.diffKey];
    this.check = opts.check || function () { return false; };
    this.turn = 0;
    this.units = [];
    this.plans = {};
    this.enemyActions = [];
    this.result = null;
    this.stats = { clashWin: 0, clashLose: 0, turns: 0 };
    this._seq = 0;
    var self = this, level = this.def.level || 1;
    (opts.party || []).forEach(function (p) { self._addAlly(p, level); });
    var mods = (this.def.mods || []).filter(function (m) { return self.check(m.if); });
    this.def.enemies.forEach(function (entry) { self._addEnemy(entry, mods); });
    // 부위 연결
    this.units.forEach(function (u) {
      if (u.side !== 'enemy' || !u.partIds) return;
      u.partIds.forEach(function (pid) {
        self.units.forEach(function (p) {
          if (p.side === 'enemy' && p.id === pid && !p.partOf) { p.partOf = u.uid; u.parts.push(p.uid); }
        });
      });
    });
  }
  G.Battle = Battle;

  Battle.prototype._addAlly = function (p, level) {
    var d = D(), c = d.characters[p.id];
    var eng = p.engraving && d.engravings[p.engraving] ? d.engravings[p.engraving] : null;
    var mods = eng ? eng.mods : {};
    var up = p.upgrade || 0;
    var hp = Math.round(c.hp * (1 + 0.07 * (level - 1)) * (1 + 0.05 * up) * (1 + (mods.hpPct || 0)));
    var u = {
      uid: 'a' + (this._seq++), side: 'ally', id: p.id, name: c.name, color: c.color,
      element: c.element, portrait: 'assets/portrait/' + p.id + '.png',
      maxHp: hp, hp: hp,
      atk: 1 + 0.07 * (level - 1) + 0.05 * up,
      speed: [c.speed[0] + (mods.speed || 0), c.speed[1] + (mods.speed || 0)],
      diceCount: 1,
      resolve: U.clamp((this.diff.resolve || 0) + (p.resolveBonus || 0) + (mods.startResolve || 0), C.RES_MIN, C.RES_MAX),
      glow: U.clamp(mods.startGlow || 0, 0, C.GLOW_MAX),
      st: {}, nx: {}, breaks: (c.breaks || [0.5, 0.2]).map(function (f) { return Math.round(f * hp); }),
      brokenUntil: -1, panic: false, dead: false,
      deck: c.deck.slice(), ratio: c.ratio.slice(), pile: [], hand: [],
      guard: c.guard, ult: c.ult, sealed: {}, usage: {}, mods: mods, dice: [],
      engraving: p.engraving || null,
      // 레벨(장 진행)과 단련이 격돌 위력에도 반영된다
      powerUp: Math.floor(level / 2) + (up >= 3 ? 1 : 0)
    };
    this.units.push(u);
    return u;
  };

  Battle.prototype._addEnemy = function (entry, mods) {
    var d = D();
    if (typeof entry === 'string') entry = { id: entry };
    var e = d.enemies[entry.id];
    if (!e) throw new Error('알 수 없는 적: ' + entry.id);
    var hpMult = (entry.hpMult || 1) * this.diff.hp * (this.def.scale || 1);
    var extraDice = 0;
    mods.forEach(function (m) {
      if (m.enemy === entry.id) { hpMult *= (m.hpMult || 1); extraDice += (m.dice || 0); }
    });
    var hp = Math.round(e.hp * hpMult);
    var u = {
      uid: 'e' + (this._seq++), side: 'enemy', id: entry.id, name: entry.name || e.name, color: e.color,
      tier: e.tier, portrait: 'assets/enemy/' + (e.img || entry.id) + '.png',
      maxHp: hp, hp: hp, atk: (e.atk || 1) * this.diff.dmg,
      speed: [e.speed[0] + (this.diff.speed || 0), e.speed[1] + (this.diff.speed || 0)],
      diceCount: (e.dice || 1) + extraDice,
      resolve: e.resolve || 0, glow: 0,
      st: {}, nx: {}, breaks: (e.breaks || [0.5]).map(function (f) { return Math.round(f * hp); }),
      brokenUntil: -1, panic: false, dead: false,
      resist: e.resist || {}, skills: e.skills.slice(), weights: (e.weights || e.skills.map(function () { return 1; })).slice(),
      pattern: e.pattern || null, intercept: !!e.intercept, focusTarget: e.focusTarget || null,
      partIds: e.parts || null, parts: [], partOf: null, partShield: e.shieldWhileParts || 0,
      disables: e.disables || [], disabled: {},
      phases: (e.phases || []).map(function (p) { return U.clone(p); }),
      gimmick: e.gimmick ? U.clone(e.gimmick) : null, revived: false, powerUp: 0,
      desc: e.desc || '', dice: [], sealed: {}, usage: {}, mods: {}
    };
    this.units.push(u);
    return u;
  };

  // ---------------------------------------------------------------- 조회
  Battle.prototype.unit = function (uid) {
    for (var i = 0; i < this.units.length; i++) if (this.units[i].uid === uid) return this.units[i];
    return null;
  };
  Battle.prototype.allies = function (alive) {
    return this.units.filter(function (u) { return u.side === 'ally' && (!alive || !u.dead); });
  };
  Battle.prototype.enemies = function (alive) {
    return this.units.filter(function (u) { return u.side === 'enemy' && (!alive || !u.dead); });
  };
  Battle.prototype.isBroken = function (u) { return u.brokenUntil >= this.turn; };
  Battle.prototype.lampProb = function (u) {
    var p = 0.5 + u.resolve * C.LAMP_PER_RES + ((u.mods && u.mods.lampProb) || 0);
    if (u.panic) p -= 0.1;
    return U.clamp(p, 0.05, 0.95);
  };
  Battle.prototype.skill = function (id) { return skillDef(id); };
  Battle.prototype.handOptions = function (u) {
    var opts = u.hand.slice();
    if (u.ult && u.glow >= C.GLOW_MAX) opts.push(u.ult);
    return opts;
  };

  // ---------------------------------------------------------------- 상태 이상
  var NEXT_TURN = { haste: 1, bind: 1, focus: 1, taunt: 1 };
  Battle.prototype.addStatus = function (u, st, n, ev, src) {
    if (!u || u.dead || !n) return;
    if (src && src.side === 'ally' && src.mods) {
      if (st === 'bleed') n += src.mods.bleedPlus || 0;
      if (st === 'burn') n += src.mods.burnPlus || 0;
    }
    var bag = NEXT_TURN[st] ? u.nx : u.st;
    bag[st] = Math.min(20, (bag[st] || 0) + n);
    ev.push({ t: 'status', uid: u.uid, status: st, n: n, total: bag[st] });
  };
  Battle.prototype.changeResolve = function (u, n, ev, why) {
    if (!u || u.dead || !n) return;
    var before = u.resolve;
    u.resolve = U.clamp(u.resolve + n, C.RES_MIN, C.RES_MAX);
    if (u.resolve !== before) ev.push({ t: 'resolve', uid: u.uid, delta: u.resolve - before, value: u.resolve, why: why || '' });
  };
  Battle.prototype.addGlow = function (u, n) {
    if (!u || u.dead || u.side !== 'ally') return;
    u.glow = U.clamp(u.glow + n, 0, C.GLOW_MAX);
  };
  Battle.prototype.heal = function (u, n, ev) {
    if (!u || u.dead || n <= 0) return;
    var before = u.hp;
    u.hp = Math.min(u.maxHp, u.hp + Math.round(n));
    if (u.hp > before) ev.push({ t: 'heal', uid: u.uid, n: u.hp - before, hp: u.hp });
  };

  // ---------------------------------------------------------------- 턴 시작
  Battle.prototype.startTurn = function () {
    var self = this, ev = [];
    this.turn++;
    this.stats.turns = this.turn;
    this.plans = {};
    ev.push({ t: 'turnStart', turn: this.turn });

    // 전투 이벤트 대사
    (this.def.events || []).forEach(function (e) {
      if (e.turn === self.turn) ev.push({ t: 'text', text: e.text, speaker: e.speaker || '' });
    });

    this.units.forEach(function (u) {
      if (u.dead) return;
      // 침식
      if (u.st.erosion) {
        self.changeResolve(u, -Math.min(6, u.st.erosion), ev, '침식');
        u.st.erosion--;
      }
      // 다음 턴 효과 적용
      u.st.focus = u.nx.focus || 0;
      u.st.taunt = u.nx.taunt || 0;
      u.spdMod = (u.nx.haste || 0) - (u.nx.bind || 0);
      u.nx = {};
      // 봉인 감소
      Object.keys(u.sealed).forEach(function (k) { if (--u.sealed[k] <= 0) delete u.sealed[k]; });
    });

    this._gimmicksAtStart(ev);

    this.units.forEach(function (u) {
      u.dice = [];
      u.guarding = null;
      if (u.dead) return;
      if (u.side === 'ally' && u.resolve <= C.PANIC_AT && !u.panic) {
        u.panic = true;
        ev.push({ t: 'panic', uid: u.uid });
      }
      if (self.isBroken(u)) return;
      for (var i = 0; i < u.diceCount; i++) {
        var s = self.rng.int(u.speed[0], u.speed[1]) + (u.spdMod || 0);
        u.dice.push({ speed: Math.max(1, s) });
      }
      u.dice.sort(function (a, b) { return b.speed - a.speed; });
      if (u.side === 'ally') self._refillHand(u);
    });

    // 적의 행동 선언
    this.enemyActions = [];
    this.enemies(true).forEach(function (u) {
      u.dice.forEach(function (die, i) {
        var sk = self._enemySkill(u, i);
        var tgt = self._enemyTarget(u);
        if (!sk || !tgt) return;
        self.enemyActions.push({ uid: u.uid, die: i, skill: sk, target: tgt.uid, origTarget: tgt.uid, speed: die.speed });
      });
    });

    // 공황 상태 아군은 무작위로 행동
    this.allies(true).forEach(function (u) {
      if (u.panic && u.dice.length) {
        var sk = self.rng.pick(u.hand);
        var ea = self.enemyActions.length ? self.rng.pick(self.enemyActions) : null;
        var tgtEnemy = ea ? { uid: ea.uid, die: ea.die } : { uid: self.rng.pick(self.enemies(true)).uid, die: -1 };
        self.plans[u.uid] = { skill: sk, target: tgtEnemy, auto: true };
      }
    });
    return ev;
  };

  Battle.prototype._refillHand = function (u) {
    var self = this;
    // 봉인된 카드는 손에서 버린다
    u.hand = u.hand.filter(function (s) { return !u.sealed[s]; });
    var guard = 0;
    while (u.hand.length < 2 && guard++ < 40) {
      if (!u.pile.length) {
        u.deck.forEach(function (sid, i) { for (var k = 0; k < (u.ratio[i] || 1); k++) u.pile.push(sid); });
        self.rng.shuffle(u.pile);
      }
      var s = u.pile.pop();
      if (!u.sealed[s]) u.hand.push(s);
    }
    if (u.hand.length < 2) { // 모두 봉인된 경우
      while (u.hand.length < 2) u.hand.push(u.deck[0]);
    }
  };

  Battle.prototype._enemySkill = function (u, dieIdx) {
    var avail = u.skills.filter(function (s) { return !u.disabled[s]; });
    if (!avail.length) return null;
    if (u.pattern) {
      var row = u.pattern[(this.turn - 1) % u.pattern.length];
      var s = row[dieIdx % row.length];
      if (avail.indexOf(s) >= 0) return s;
    }
    var w = avail.map(function (s) { var i = u.skills.indexOf(s); return u.weights[i] || 1; });
    return this.rng.weighted(avail, w);
  };

  Battle.prototype._enemyTarget = function (u) {
    var allies = this.allies(true);
    if (!allies.length) return null;
    if (u.focusTarget) {
      var f = allies.filter(function (a) { return a.id === u.focusTarget; })[0];
      if (f && this.rng.next() < 0.6) return f;
    }
    var w = allies.map(function (a) {
      return 1 + (1 - a.hp / a.maxHp) * 1.5 + (a.st.taunt ? 4 : 0);
    });
    return this.rng.weighted(allies, w);
  };

  // ---------------------------------------------------------------- 기믹
  Battle.prototype._gimmicksAtStart = function (ev) {
    var self = this;
    this.enemies(true).forEach(function (u) {
      var g = u.gimmick;
      if (!g) return;
      if (g.type === 'seal' && self.turn > 1 && self.turn % (g.every || 2) === 0) {
        // 각 아군이 가장 많이 쓴 기술을 '기록'해 봉인
        self.allies(true).forEach(function (a) {
          var best = null, n = 0;
          Object.keys(a.usage).forEach(function (k) {
            if (k === a.ult) return;
            if (a.usage[k] > n) { n = a.usage[k]; best = k; }
          });
          if (best) {
            a.sealed[best] = (g.turns || 2) + 1;
            a.usage[best] = 0;
            ev.push({ t: 'seal', uid: a.uid, skill: best, by: u.uid });
          }
        });
        ev.push({ t: 'text', text: g.text || '【장부가 당신들의 기술을 기록했다.】', speaker: u.name });
      }
      if (g.type === 'rewrite' && self.turn % (g.every || 3) === 0) {
        var allies = self.allies(true).filter(function (a) { return a.resolve > 0; });
        if (allies.length) {
          allies.sort(function (a, b) { return b.resolve - a.resolve; });
          var a = allies[0];
          var before = a.resolve;
          a.resolve = -a.resolve;
          ev.push({ t: 'text', text: g.text || '【개찬】', speaker: u.name });
          ev.push({ t: 'resolve', uid: a.uid, delta: a.resolve - before, value: a.resolve, why: '개찬' });
        }
      }
    });
  };

  Battle.prototype._gimmicksAtEnd = function (ev) {
    var self = this;
    this.enemies(true).forEach(function (u) {
      var g = u.gimmick;
      if (!g) return;
      if (g.type === 'chorus') {
        var alive = u.parts.filter(function (pid) { return !self.unit(pid).dead; });
        if (u.parts.length && alive.length === u.parts.length) {
          ev.push({ t: 'text', text: g.text || '합창이 울려 퍼진다.', speaker: u.name });
          self.allies(true).forEach(function (a) {
            self.changeResolve(a, -(g.resolve || 8), ev, '합창');
            self.addStatus(a, 'erosion', g.erosion || 1, ev);
          });
        }
      }
      if (g.type === 'twin') {
        // 짝이 죽으면 남은 쪽이 격앙
        var mate = self.units.filter(function (x) { return x.side === 'enemy' && x.id === g.mate; })[0];
        if (mate && mate.dead && !u._enraged) {
          u._enraged = true;
          u.powerUp += g.power || 2;
          u.diceCount += 1;
          ev.push({ t: 'text', text: g.text || u.name + '이(가) 격앙했다!', speaker: u.name });
        }
      }
    });
  };

  // ---------------------------------------------------------------- 계획
  Battle.prototype.setPlan = function (uid, plan) {
    var u = this.unit(uid);
    if (!u || u.dead || !u.dice.length || u.panic) return false;
    if (plan.skill === 'guard') { this.plans[uid] = { skill: 'guard' }; return true; }
    if (this.handOptions(u).indexOf(plan.skill) < 0) return false;
    var t = plan.target && this.unit(plan.target.uid);
    if (!t || t.dead || t.side !== 'enemy') return false;
    this.plans[uid] = { skill: plan.skill, target: { uid: t.uid, die: plan.target.die === undefined ? -1 : plan.target.die } };
    return true;
  };
  Battle.prototype.clearPlan = function (uid) { delete this.plans[uid]; };
  Battle.prototype.readyAllies = function () {
    return this.allies(true).filter(function (u) { return u.dice.length > 0; });
  };
  Battle.prototype.allPlanned = function () {
    var self = this;
    return this.readyAllies().every(function (u) { return !!self.plans[u.uid]; });
  };
  Battle.prototype.findEnemyAction = function (uid, die) {
    for (var i = 0; i < this.enemyActions.length; i++) {
      var a = this.enemyActions[i];
      if (a.uid === uid && a.die === die) return a;
    }
    return null;
  };

  /** 화음 계산: 같은 속성 스킬을 이번 턴에 2장 이상 쓰면 보너스. 무색은 가장 큰 무리에 합류. */
  Battle.prototype.computeHarmony = function (plans) {
    var self = this, groups = {}, blanks = [];
    plans = plans || this.plans;
    Object.keys(plans).forEach(function (uid) {
      var p = plans[uid];
      if (!p || p.skill === 'guard' || p.auto) return;
      var sk = skillDef(p.skill);
      if (!sk) return;
      if (sk.element === 'blank') blanks.push(uid);
      else (groups[sk.element] = groups[sk.element] || []).push(uid);
    });
    if (blanks.length) {
      var best = null;
      Object.keys(groups).forEach(function (k) { if (!best || groups[k].length > groups[best].length) best = k; });
      if (best) groups[best] = groups[best].concat(blanks);
      else groups.blank = blanks;
    }
    var out = { bonus: {}, groups: [] };
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      if (g.length >= 2) {
        out.groups.push({ element: k, uids: g, size: g.length });
        g.forEach(function (uid) { out.bonus[uid] = g.length - 1; });
      }
    });
    return out;
  };

  /** 모든 계획을 바탕으로 격돌/일방 공격 구도를 계산한다. 미리보기와 실제 처리에서 공용. */
  Battle.prototype.computeEngagements = function (plans) {
    var self = this;
    plans = plans || this.plans;
    var claimed = {}, redirect = {}, eng = [], modes = {};
    var allyActs = this.readyAllies().filter(function (u) { return plans[u.uid]; }).map(function (u) {
      return { u: u, plan: plans[u.uid], speed: u.dice[0].speed };
    });
    allyActs.sort(function (a, b) { return b.speed - a.speed; });
    allyActs.forEach(function (aa) {
      var p = aa.plan;
      if (p.skill === 'guard') { modes[aa.u.uid] = { mode: 'guard' }; return; }
      var ea = p.target.die >= 0 ? self.findEnemyAction(p.target.uid, p.target.die) : null;
      var key = ea ? ea.uid + ':' + ea.die : null;
      if (ea && !claimed[key]) {
        var mode = null;
        if (ea.target === aa.u.uid) mode = 'clash';
        else if (!aa.u.panic && aa.speed > ea.speed) mode = 'intercept';
        else if (self.unit(ea.uid).intercept && ea.speed > aa.speed) mode = 'counter';
        if (mode) {
          claimed[key] = aa.u.uid;
          redirect[key] = aa.u.uid;
          eng.push({ type: 'clash', ally: aa, ea: ea, speed: Math.max(aa.speed, ea.speed), mode: mode });
          modes[aa.u.uid] = { mode: mode, ea: ea };
          return;
        }
      }
      eng.push({ type: 'ally', ally: aa, targetUid: p.target.uid, speed: aa.speed });
      modes[aa.u.uid] = { mode: 'onesided', ea: ea, slower: ea ? aa.speed <= ea.speed : false, claimedBy: ea ? claimed[key] : null };
    });
    this.enemyActions.forEach(function (ea) {
      var key = ea.uid + ':' + ea.die;
      if (claimed[key]) return;
      eng.push({ type: 'enemy', ea: ea, targetUid: ea.target, speed: ea.speed });
    });
    eng.sort(function (a, b) {
      if (b.speed !== a.speed) return b.speed - a.speed;
      var sa = a.type === 'enemy' ? 1 : 0, sb = b.type === 'enemy' ? 1 : 0;
      return sa - sb;
    });
    return { list: eng, modes: modes, redirect: redirect };
  };

  // ---------------------------------------------------------------- 위력 계산
  Battle.prototype.basePower = function (u, sk, ctx) {
    ctx = ctx || {};
    var p = sk.base + (u.st.focus || 0) + (u.powerUp || 0);
    if (u.mods) {
      p += u.mods.powerAll || 0;
      if (u.mods.skillPower && u.mods.skillPower[sk.id]) p += u.mods.skillPower[sk.id];
    }
    if (ctx.harmony) p += ctx.harmony;
    if (sk.powerIf && ctx.target) {
      var t = ctx.target;
      if ((t.st[sk.powerIf.status] || 0) >= (sk.powerIf.min || 1)) p += sk.powerIf.n;
    }
    if (sk.perAlly && u.side === 'ally') p += sk.perAlly * (this.allies(true).length - 1);
    if (sk.lowHp && u.hp / u.maxHp < 0.5) p += sk.lowHp;
    return p;
  };

  Battle.prototype._flip = function (u, rng) {
    if (u.st.paralyze > 0) { u.st.paralyze--; return false; }
    return (rng || this.rng).next() < this.lampProb(u);
  };

  Battle.prototype._rollClash = function (side, rng) {
    var u = side.u, sk = side.sk, power = this.basePower(u, sk, side.ctx), flips = [];
    for (var i = 0; i < side.lamps; i++) {
      var h = this._flip(u, rng);
      flips.push(h);
      if (h) power += sk.bonus;
    }
    return { power: Math.max(0, power), flips: flips };
  };

  /** 미리보기용 승률 (본 전투 난수를 건드리지 않는다). */
  Battle.prototype.winRate = function (allyU, skillId, ea, harmony) {
    var sk = skillDef(skillId), esk = skillDef(ea.skill), eu = this.unit(ea.uid);
    var rng = new G.RNG(this.turn * 7919 + allyU.uid.length * 31 + skillId.length);
    var wins = 0, N = 160;
    var saveA = allyU.st.paralyze || 0, saveE = eu.st.paralyze || 0;
    for (var n = 0; n < N; n++) {
      allyU.st.paralyze = saveA; eu.st.paralyze = saveE;
      var a = { u: allyU, sk: sk, lamps: sk.lamps, ctx: { harmony: harmony || 0, target: eu } };
      var b = { u: eu, sk: esk, lamps: esk.lamps, ctx: { target: allyU } };
      var r = 0;
      while (a.lamps > 0 && b.lamps > 0 && r++ < 30) {
        var ra = this._rollClash(a, rng), rb = this._rollClash(b, rng);
        if (ra.power > rb.power) b.lamps--; else if (rb.power > ra.power) a.lamps--;
      }
      if (a.lamps > 0 && b.lamps === 0) wins++;
    }
    allyU.st.paralyze = saveA; eu.st.paralyze = saveE;
    return wins / N;
  };

  Battle.prototype.preview = function (uid) {
    var p = this.plans[uid];
    if (!p) return null;
    var res = this.computeEngagements();
    var m = res.modes[uid];
    if (!m) return null;
    var out = { mode: m.mode, ea: m.ea || null };
    if (m.mode === 'clash' || m.mode === 'intercept' || m.mode === 'counter') {
      var h = this.computeHarmony().bonus[uid] || 0;
      out.winRate = this.winRate(this.unit(uid), p.skill, m.ea, h);
    }
    return out;
  };

  // ---------------------------------------------------------------- 자동 편성
  Battle.prototype.expectedDamage = function (u, sk, lampsN) {
    var p = this.lampProb(u), base = this.basePower(u, sk, {}), total = 0, pw = base;
    var n = lampsN === undefined ? sk.lamps : lampsN;
    for (var i = 0; i < n; i++) { pw += sk.bonus * p; total += Math.max(0, pw); }
    return total * u.atk;
  };

  Battle.prototype.autoPlan = function (onlyUnplanned) {
    var self = this;
    var allies = this.readyAllies().filter(function (u) { return !u.panic && (!onlyUnplanned || !self.plans[u.uid]); });
    allies.sort(function (a, b) { return b.dice[0].speed - a.dice[0].speed; });
    allies.forEach(function (u) {
      var best = null, bestV = -1e9;
      var opts = self.handOptions(u);
      var enemies = self.enemies(true);
      opts.forEach(function (sid) {
        var sk = skillDef(sid);
        var isUlt = sid === u.ult;
        // 1) 적 행동과 격돌
        self.enemyActions.forEach(function (ea) {
          var trial = U.clone(self.plans);
          trial[u.uid] = { skill: sid, target: { uid: ea.uid, die: ea.die } };
          var m = self.computeEngagements(trial).modes[u.uid];
          var eu = self.unit(ea.uid), esk = skillDef(ea.skill);
          var threat = self.expectedDamage(eu, esk);
          var dmg = self.expectedDamage(u, sk) * self._elemMult(eu, sk.element);
          var v;
          if (m.mode === 'onesided') {
            v = dmg * (self.isBroken(eu) ? C.BROKEN_TAKEN : 1) + (1 - eu.hp / eu.maxHp) * 4;
            if (ea.target === u.uid) v -= threat * 0.6;
          } else {
            var wr = self.winRate(u, sid, ea, 0);
            v = wr * (dmg * 0.75 + threat) - (1 - wr) * threat * 0.7 + 3;
            var tgtAlly = self.unit(ea.origTarget);
            if (tgtAlly && tgtAlly !== u && tgtAlly.hp / tgtAlly.maxHp < 0.4) v += wr * 6;
          }
          if (isUlt) v *= 1.4;
          if (v > bestV) { bestV = v; best = { skill: sid, target: { uid: ea.uid, die: ea.die } }; }
        });
        // 2) 행동 불가(붕괴) 적에게 일방 공격
        enemies.forEach(function (eu) {
          if (eu.dice.length) return;
          var v = self.expectedDamage(u, sk) * self._elemMult(eu, sk.element) * C.BROKEN_TAKEN + 4;
          if (isUlt) v *= 1.4;
          if (v > bestV) { bestV = v; best = { skill: sid, target: { uid: eu.uid, die: -1 } }; }
        });
      });
      // 3) 체력이 낮으면 수비
      if (u.hp / u.maxHp < 0.25 && bestV < 6) best = { skill: 'guard' };
      if (!best) best = { skill: 'guard' };
      self.plans[u.uid] = best;
    });
  };

  // ---------------------------------------------------------------- 턴 처리
  Battle.prototype._elemMult = function (target, element) {
    if (target.side !== 'enemy') return 1;
    var r = target.resist[element];
    return r === undefined ? 1 : r;
  };

  Battle.prototype.resolveTurn = function () {
    var self = this, ev = [];
    // 계획이 없는 아군은 수비
    this.readyAllies().forEach(function (u) { if (!self.plans[u.uid]) self.plans[u.uid] = { skill: 'guard' }; });

    // 수비 등록
    this.readyAllies().forEach(function (u) {
      var p = self.plans[u.uid];
      if (p.skill === 'guard') {
        u.guarding = { sk: skillDef(u.guard) };
        ev.push({ t: 'guardUp', uid: u.uid, skill: u.guard });
        self._effects(u, u.guarding.sk, 'use', null, ev);
      }
    });

    // 화음
    var harm = this.computeHarmony();
    harm.groups.forEach(function (g) {
      ev.push({ t: 'harmony', element: g.element, size: g.size, uids: g.uids });
      g.uids.forEach(function (uid) {
        var u = self.unit(uid);
        self.addGlow(u, C.GLOW_HARMONY * (g.size - 1));
        if (g.size >= 3) self.changeResolve(u, 3, ev, '완전 화음');
      });
    });

    var engs = this.computeEngagements();
    // 가로채기 반영
    Object.keys(engs.redirect).forEach(function (key) {
      var parts = key.split(':');
      var ea = self.findEnemyAction(parts[0], +parts[1]);
      if (ea) ea.target = engs.redirect[key];
    });

    engs.list.forEach(function (e) {
      if (self.result) return;
      if (e.type === 'clash') self._doClash(e, harm, ev);
      else if (e.type === 'ally') self._doAllyOneSided(e.ally, e.targetUid, harm, ev);
      else self._doEnemyOneSided(e.ea, ev);
      self._checkResult(ev);
    });

    if (!this.result) this._endTurn(ev);
    return ev;
  };

  Battle.prototype._canAct = function (u) { return u && !u.dead && !this.isBroken(u); };

  Battle.prototype._useSkill = function (u, sid, ev) {
    // 손에서 제거 / 사용 횟수 / 극의 비용
    if (u.side !== 'ally') return;
    if (sid === u.ult) {
      u.glow = Math.max(0, u.glow - C.GLOW_MAX);
      ev.push({ t: 'ult', uid: u.uid, skill: sid });
    } else {
      var i = u.hand.indexOf(sid);
      if (i >= 0) u.hand.splice(i, 1);
      u.usage[sid] = (u.usage[sid] || 0) + 1;
    }
  };

  Battle.prototype._doClash = function (e, harm, ev) {
    var au = e.ally.u, eu = this.unit(e.ea.uid);
    var aOk = this._canAct(au), eOk = this._canAct(eu);
    if (!aOk && !eOk) return;
    if (!aOk) { this._doEnemyOneSided(e.ea, ev); return; }
    if (!eOk) { this._doAllyOneSided(e.ally, eu.uid, harm, ev); return; }
    var ask = skillDef(e.ally.plan.skill), esk = skillDef(e.ea.skill);
    this._useSkill(au, ask.id, ev);
    if (e.mode === 'intercept') ev.push({ t: 'intercept', uid: au.uid, enemy: eu.uid, from: e.ea.origTarget });
    if (e.mode === 'counter') ev.push({ t: 'counter', uid: eu.uid, ally: au.uid });
    var A = { u: au, sk: ask, lamps: ask.lamps, ctx: { harmony: harm.bonus[au.uid] || 0, target: eu } };
    var B = { u: eu, sk: esk, lamps: esk.lamps, ctx: { target: au } };
    this._effects(au, ask, 'use', eu, ev);
    this._effects(eu, esk, 'use', au, ev);
    ev.push({ t: 'clashStart', a: au.uid, b: eu.uid, askill: ask.id, bskill: esk.id, alamps: A.lamps, blamps: B.lamps });
    var rounds = 0;
    while (A.lamps > 0 && B.lamps > 0) {
      rounds++;
      var ra = this._rollClash(A), rb = this._rollClash(B);
      var loser = null;
      if (ra.power > rb.power) { B.lamps--; loser = 'b'; }
      else if (rb.power > ra.power) { A.lamps--; loser = 'a'; }
      else if (rounds > 12) { // 끝없는 무승부 방지
        if (this.rng.next() < 0.5) { B.lamps--; loser = 'b'; } else { A.lamps--; loser = 'a'; }
      }
      ev.push({ t: 'clashRound', a: au.uid, b: eu.uid, ap: ra.power, bp: rb.power, af: ra.flips, bf: rb.flips, alamps: A.lamps, blamps: B.lamps, loser: loser, round: rounds });
      if (rounds > 40) break;
    }
    var win = A.lamps > 0 ? A : B, lose = win === A ? B : A;
    if (win === A) this.stats.clashWin++; else this.stats.clashLose++;
    ev.push({ t: 'clashEnd', winner: win.u.uid, loser: lose.u.uid, rounds: rounds });
    var wm = win.u.mods || {};
    this.changeResolve(win.u, C.CLASH_WIN_RES + Math.min(rounds, 5) + (wm.resolveOnWin || 0), ev, '격돌 승리');
    this.changeResolve(lose.u, C.CLASH_LOSE_RES, ev, '격돌 패배');
    this.addGlow(win.u, C.GLOW_CLASH_WIN + (wm.glowOnWin || 0));
    this._effects(win.u, win.sk, 'win', lose.u, ev);
    this._attack(win.u, win.sk, lose.u, win.lamps, win.ctx, false, ev);
  };

  Battle.prototype._doAllyOneSided = function (aa, targetUid, harm, ev) {
    var u = aa.u;
    if (!this._canAct(u)) return;
    var t = this.unit(targetUid);
    if (!t || t.dead) {
      var alive = this.enemies(true);
      if (!alive.length) return;
      t = alive[0];
    }
    var sk = skillDef(aa.plan.skill);
    this._useSkill(u, sk.id, ev);
    this._effects(u, sk, 'use', t, ev);
    this._attack(u, sk, t, sk.lamps, { harmony: harm.bonus[u.uid] || 0, target: t }, true, ev);
  };

  Battle.prototype._doEnemyOneSided = function (ea, ev) {
    var u = this.unit(ea.uid);
    if (!this._canAct(u)) return;
    var t = this.unit(ea.target);
    if (!t || t.dead) {
      var alive = this.allies(true);
      if (!alive.length) return;
      t = this.rng.pick(alive);
    }
    var sk = skillDef(ea.skill);
    this._effects(u, sk, 'use', t, ev);
    this._attack(u, sk, t, sk.lamps, { target: t }, true, ev);
  };

  Battle.prototype._attack = function (u, sk, t, lamps, ctx, oneSided, ev) {
    var power = this.basePower(u, sk, ctx);
    var guard = null;
    if (oneSided && t.guarding && !t.dead && !this.isBroken(t)) {
      var gs = t.guarding.sk;
      var gr = this._rollClash({ u: t, sk: gs, lamps: gs.lamps, ctx: {} });
      guard = { pool: gr.power + ((t.mods && t.mods.guardPlus) || 0), flips: gr.flips, uid: t.uid, total: 0 };
      ev.push({ t: 'guard', uid: t.uid, power: guard.pool, flips: gr.flips });
    }
    ev.push({ t: 'attackStart', uid: u.uid, target: t.uid, skill: sk.id, lamps: lamps, oneSided: oneSided });
    for (var i = 0; i < lamps; i++) {
      if (u.dead || t.dead) break;
      if (u.st.bleed) this._damage(u, u.st.bleed, null, ev, 'bleed');
      if (u.dead) break;
      var h = this._flip(u);
      if (h) power += sk.bonus;
      var dmg = Math.max(0, power) * u.atk * this._elemMult(t, sk.element);
      if (this.isBroken(t)) dmg *= C.BROKEN_TAKEN;
      if (t.panic) dmg *= C.PANIC_TAKEN;
      if (t.side === 'enemy' && t.parts.length && t.partShield) {
        var alive = t.parts.filter(function (pid) { return !this.unit(pid).dead; }, this).length;
        if (alive) dmg *= (1 - t.partShield);
      }
      dmg -= (t.st.shield || 0);
      dmg = Math.max(power > 0 ? 1 : 0, Math.round(dmg));
      var blocked = 0;
      if (guard && guard.pool > 0) {
        blocked = Math.min(guard.pool, dmg);
        guard.pool -= blocked; guard.total += blocked; dmg -= blocked;
      }
      ev.push({ t: 'hit', uid: u.uid, target: t.uid, lamp: i, heads: h, power: power, dmg: dmg, blocked: blocked });
      if (dmg > 0) this._damage(t, dmg, u, ev, 'hit');
      if (!t.dead) {
        this._effects(u, sk, 'hit', t, ev);
        if (h) this._effects(u, sk, 'heads', t, ev);
      }
    }
    if (guard && guard.total > 0 && !t.dead) {
      this.changeResolve(t, 2, ev, '수비');
    }
  };

  Battle.prototype._damage = function (t, dmg, src, ev, kind) {
    if (t.dead) return;
    t.hp -= dmg;
    if (kind !== 'hit') ev.push({ t: 'dot', uid: t.uid, status: kind, dmg: dmg });
    if (t.side === 'ally' && kind === 'hit') this.addGlow(t, C.GLOW_HIT_TAKEN);
    // 자세 붕괴
    var broke = false;
    while (t.breaks.length && t.hp <= t.breaks[0] && t.hp > 0) { t.breaks.shift(); broke = true; }
    if (broke && !this.isBroken(t)) {
      t.brokenUntil = this.turn + 1;
      ev.push({ t: 'break', uid: t.uid });
    }
    // 단계 전환
    this._checkPhase(t, ev);
    if (t.hp <= 0) this._kill(t, src, ev);
  };

  Battle.prototype._checkPhase = function (u, ev) {
    if (u.side !== 'enemy' || !u.phases.length || u.dead) return;
    var self = this;
    u.phases.forEach(function (ph) {
      if (ph.done || u.hp > ph.at * u.maxHp || u.hp <= 0) return;
      ph.done = true;
      ev.push({ t: 'phase', uid: u.uid, text: ph.text || '', name: ph.name || '' });
      if (ph.addDice) u.diceCount += ph.addDice;
      if (ph.powerUp) u.powerUp += ph.powerUp;
      if (ph.skills) { u.skills = ph.skills.slice(); u.weights = (ph.weights || ph.skills.map(function () { return 1; })).slice(); }
      if (ph.pattern !== undefined) u.pattern = ph.pattern;
      if (ph.intercept) u.intercept = true;
      if (ph.speedUp) { u.speed = [u.speed[0] + ph.speedUp, u.speed[1] + ph.speedUp]; }
      if (ph.healPct) self.heal(u, u.maxHp * ph.healPct, ev);
      if (ph.cleanse) { u.st = {}; }
      if (ph.breaks) u.breaks = ph.breaks.map(function (f) { return Math.round(f * u.maxHp); }).filter(function (v) { return v < u.hp; });
    });
  };

  Battle.prototype._kill = function (t, src, ev) {
    var self = this;
    // 컨티뉴 기믹
    if (t.gimmick && t.gimmick.type === 'continue' && !t.revived) {
      t.revived = true;
      t.hp = Math.round(t.maxHp * (t.gimmick.hpPct || 0.5));
      t.diceCount += t.gimmick.addDice || 1;
      t.powerUp += t.gimmick.powerUp || 1;
      t.breaks = (t.gimmick.breaks || [0.25]).map(function (f) { return Math.round(f * t.maxHp); });
      t.brokenUntil = -1;
      t.st = {};
      ev.push({ t: 'phase', uid: t.uid, text: t.gimmick.text || 'CONTINUE?', name: 'CONTINUE' });
      return;
    }
    t.hp = 0;
    t.dead = true;
    t.dice = [];
    ev.push({ t: 'death', uid: t.uid });
    if (t.side === 'ally') {
      this.allies(true).forEach(function (a) { self.changeResolve(a, C.ALLY_DEATH_RES, ev, '동료 쓰러짐'); });
    } else {
      this.allies(true).forEach(function (a) { self.changeResolve(a, C.ENEMY_KILL_RES, ev, '적 격파'); });
      if (src && src.side === 'ally') this.changeResolve(src, 3, ev, '격파');
      // 부위 파괴
      if (t.partOf) {
        var core = this.unit(t.partOf);
        if (core && !core.dead) {
          ev.push({ t: 'partBreak', uid: t.uid, core: core.uid });
          var dis = D().enemies[t.id].disables || [];
          dis.forEach(function (s) { core.disabled[s] = true; });
          if (dis.length) ev.push({ t: 'text', text: t.name + ' 파괴! ' + core.name + '의 기술이 봉쇄되었다.', speaker: '' });
          var c = D().enemies[t.id].onBreak;
          if (c && c.coreDamage) this._damage(core, Math.round(core.maxHp * c.coreDamage), src, ev, 'part');
          if (c && c.coreBreak && !core.dead && !this.isBroken(core)) {
            core.brokenUntil = this.turn + 1; ev.push({ t: 'break', uid: core.uid });
          }
        }
      }
      if (t.parts.length) {
        t.parts.forEach(function (pid) {
          var p = self.unit(pid);
          if (p && !p.dead) { p.hp = 0; p.dead = true; p.dice = []; ev.push({ t: 'death', uid: p.uid }); }
        });
      }
    }
  };

  Battle.prototype._effects = function (u, sk, when, target, ev) {
    if (!sk || !sk.effects) return;
    var self = this;
    sk.effects.forEach(function (ef) {
      if (ef.when !== when) return;
      var tg = self._effTargets(ef.target || 'target', u, target);
      tg.forEach(function (t) {
        if (!t || t.dead) return;
        if (ef.do === 'status') self.addStatus(t, ef.status, ef.n, ev, u);
        else if (ef.do === 'heal') {
          var n = (ef.n || 0) + (ef.pct ? t.maxHp * ef.pct : 0) + ((u.mods && u.mods.healPlus) || 0);
          self.heal(t, n, ev);
        } else if (ef.do === 'resolve') self.changeResolve(t, ef.n, ev, sk.name);
        else if (ef.do === 'glow') self.addGlow(t, ef.n);
      });
    });
  };

  Battle.prototype._effTargets = function (kind, u, target) {
    var mine = u.side === 'ally' ? this.allies(true) : this.enemies(true);
    var theirs = u.side === 'ally' ? this.enemies(true) : this.allies(true);
    switch (kind) {
      case 'self': return [u];
      case 'target': return [target];
      case 'allies': return mine;
      case 'enemies': return theirs;
      case 'lowestAlly':
        return mine.length ? [mine.slice().sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; })[0]] : [];
      case 'randomEnemy': return theirs.length ? [this.rng.pick(theirs)] : [];
      default: return [target];
    }
  };

  Battle.prototype._endTurn = function (ev) {
    var self = this;
    this.units.forEach(function (u) {
      if (u.dead) return;
      if (u.st.burn) {
        var b = u.st.burn;
        u.st.burn = Math.floor(b / 2);
        self._damage(u, b, null, ev, 'burn');
        if (u.dead) return;
      }
      if (u.st.bleed) u.st.bleed = Math.floor(u.st.bleed / 2);
      if (u.st.shield) u.st.shield = Math.floor(u.st.shield / 2);
      if (u.st.paralyze) u.st.paralyze = Math.min(u.st.paralyze, 3);
      u.st.focus = 0;
      u.st.taunt = 0;
      u.guarding = null;
      if (u.brokenUntil === self.turn) {
        u.brokenUntil = -1;
        ev.push({ t: 'recover', uid: u.uid });
      }
      if (u.panic) {
        u.panic = false;
        var before = u.resolve;
        u.resolve = Math.max(u.resolve, C.PANIC_RESET);
        ev.push({ t: 'panicEnd', uid: u.uid });
        if (u.resolve !== before) ev.push({ t: 'resolve', uid: u.uid, delta: u.resolve - before, value: u.resolve, why: '정신을 차림' });
      }
    });
    this._gimmicksAtEnd(ev);
    this._checkResult(ev);
    var wc = this.def.winCondition;
    if (!this.result && wc && wc.type === 'survive' && this.turn >= wc.turns) {
      this.result = 'win';
      ev.push({ t: 'text', text: wc.text || '버텨 냈다!', speaker: '' });
      ev.push({ t: 'end', result: 'win' });
    }
    // 무한 전투 방지
    if (!this.result && this.turn >= (this.def.maxTurns || 40)) {
      this.result = 'lose';
      ev.push({ t: 'text', text: '시간이 다 되었다…', speaker: '' });
      ev.push({ t: 'end', result: 'lose' });
    }
  };

  Battle.prototype._checkResult = function (ev) {
    if (this.result) return;
    if (!this.allies(true).length) { this.result = 'lose'; ev.push({ t: 'end', result: 'lose' }); return; }
    if (!this.enemies(true).length) { this.result = 'win'; ev.push({ t: 'end', result: 'win' }); }
  };

  /** 전투 종료 후 스토리로 넘길 요약 */
  Battle.prototype.summary = function () {
    return {
      result: this.result, turns: this.turn,
      dead: this.allies().filter(function (u) { return u.dead; }).map(function (u) { return u.id; }),
      clashWin: this.stats.clashWin, clashLose: this.stats.clashLose
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
