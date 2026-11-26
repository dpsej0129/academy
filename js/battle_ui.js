/* 전투 UI: 편성 화면 + 전투 화면(계획 → 연출 재생) */
(function (root) {
  'use strict';
  var G = root.Game, U = G.util, D = function () { return root.GameData; };
  var $ = G.dom.$, el = G.dom.el;

  function elemTag(e) {
    var info = D().elements[e] || { name: e, color: '#888' };
    // 아이콘 이미지가 매니페스트에 있으면 이미지, 없으면 색 점
    if (info.icon && G.Assets.listed(info.icon)) return '<img class="elem-ico" src="' + info.icon + '" alt="">' + info.name;
    return '<span class="elem-dot" style="background:' + info.color + '"></span>' + info.name;
  }
  function skillLine(sk) {
    return sk.base + (sk.bonus >= 0 ? '+' : '') + sk.bonus + '×' + sk.lamps;
  }

  var B = G.BattleUI = {
    id: null, eng: null, disp: null, sel: null, selSkill: null, busy: false, autoBattle: false, log: [], partyIds: [],

    // ======================================================= 편성
    openFormation: function (battleId) {
      var self = this, App = G.App, story = App.story, s = story.state, d = D();
      this.gen = (this.gen || 0) + 1;
      this.autoBattle = false;
      var def = d.battles[battleId];
      this.id = battleId;
      App.show('formation');
      var scr = $('#formation-screen');
      scr.innerHTML = '';
      var wrap = el('div', 'form-wrap');
      var avail = story.availableFor(battleId);
      var max = def.fixed ? def.fixed.length : Math.min(def.maxParty || 4, avail.length);
      var forced = (def.fixed || def.forced || []).filter(function (id) { return avail.indexOf(id) >= 0; });
      var last = (s.lastParty || []).filter(function (id) { return avail.indexOf(id) >= 0; });
      var chosen = forced.slice();
      last.concat(avail).forEach(function (id) { if (chosen.length < max && chosen.indexOf(id) < 0) chosen.push(id); });

      var head = el('div', 'form-head');
      head.innerHTML = '<div class="hint">' + U.esc(s.chapterTitle || '') + '</div><h2><span class="form-head tier tier-' + def.tier + '">' +
        ({ mob: '일반', elite: '정예', boss: '보스' }[def.tier] || '') + '</span>' + U.esc(def.name) + '</h2>';
      wrap.appendChild(head);
      if (def.intro) wrap.appendChild(el('div', 'form-intro', U.esc(def.intro)));
      var en = el('div', 'form-enemies');
      var seen = {};
      def.enemies.forEach(function (e) {
        var id = typeof e === 'string' ? e : e.id;
        var ed = d.enemies[id];
        seen[ed.name] = (seen[ed.name] || 0) + 1;
      });
      Object.keys(seen).forEach(function (n) { en.appendChild(el('span', '', U.esc(n) + (seen[n] > 1 ? ' ×' + seen[n] : ''))); });
      wrap.appendChild(en);
      var info = el('div', 'form-info');
      var cnt = el('span');
      info.appendChild(cnt);
      info.appendChild(el('span', '', '난이도 <b>' + d.difficulty[s.difficulty].label + '</b>'));
      var shardEl = el('span');
      info.appendChild(shardEl);
      wrap.appendChild(info);
      var grid = el('div', 'form-grid');
      wrap.appendChild(grid);

      function refresh() {
        cnt.innerHTML = '출전 <b>' + chosen.length + ' / ' + max + '</b>' + (def.fixed ? ' (고정 편성)' : '');
        shardEl.innerHTML = '성흔 파편 <b>' + s.shards + '</b>';
        grid.innerHTML = '';
        var ids = Object.keys(d.characters);
        ids.forEach(function (id) {
          var c = d.characters[id], cs = s.chars[id];
          var isAvail = avail.indexOf(id) >= 0;
          var p = s.party;
          if (!isAvail && p.members.indexOf(id) < 0 && p.dead.indexOf(id) < 0) return; // 아직 만나지 않음
          var card = el('div', 'fcard' + (chosen.indexOf(id) >= 0 ? ' sel' : '') + (forced.indexOf(id) >= 0 ? ' locked' : '') + (isAvail ? '' : ' unavailable'));
          var pf = el('div', 'pf');
          G.Assets.fillChar(pf, id, 'normal', c.name, c.color, 'bust');
          card.appendChild(pf);
          var meta = el('div', 'meta');
          var lvl = def.level || 1;
          var hp = Math.round(c.hp * (1 + 0.07 * (lvl - 1)) * (1 + 0.05 * cs.upgrade));
          var status = p.dead.indexOf(id) >= 0 ? ' · <span style="color:var(--red)">사망</span>' : (!isAvail ? ' · 부재' : '');
          meta.innerHTML = '<div class="n">' + U.esc(c.name) + status + '</div><div class="r">' + elemTag(c.element) + ' · ' + U.esc(c.role) + '</div>' +
            '<div class="r">체력 ' + hp + ' · 속도 ' + c.speed[0] + '~' + c.speed[1] + '</div>';
          if (isAvail) {
            var sel = el('select');
            var opt0 = el('option', '', '각인 없음'); opt0.value = ''; sel.appendChild(opt0);
            c.engravings.forEach(function (eid) {
              var e = d.engravings[eid];
              var o = el('option', '', (cs.unlocked >= e.tier ? '' : '🔒 ') + e.name + ' — ' + e.desc);
              o.value = eid; o.disabled = cs.unlocked < e.tier;
              if (cs.engraving === eid) o.selected = true;
              sel.appendChild(o);
            });
            sel.onclick = function (e) { e.stopPropagation(); };
            sel.onchange = function () { cs.engraving = sel.value || null; };
            meta.appendChild(sel);
            var up = el('div', 'up');
            var cost = d.upgradeCost[cs.upgrade];
            up.innerHTML = '<span class="r">' + U.esc(d.weapons[id]) + ' +' + cs.upgrade + '</span>';
            if (cs.upgrade < d.upgradeMax) {
              var ub = el('button', 'btn small', '단련 (' + cost + ')');
              ub.disabled = s.shards < cost;
              ub.onclick = function (e) { e.stopPropagation(); s.shards -= cost; cs.upgrade++; G.App.toast(c.name + ' 단련 +' + cs.upgrade); refresh(); };
              up.appendChild(ub);
            }
            meta.appendChild(up);
          }
          card.appendChild(meta);
          card.onclick = function () {
            if (!isAvail || def.fixed || forced.indexOf(id) >= 0) return;
            var i = chosen.indexOf(id);
            if (i >= 0) chosen.splice(i, 1);
            else if (chosen.length < max) chosen.push(id);
            else G.App.toast('최대 ' + max + '명까지 출전할 수 있습니다.');
            refresh();
          };
          grid.appendChild(card);
        });
      }
      refresh();
      scr.appendChild(wrap);
      var foot = el('div', 'form-foot');
      var go = el('button', 'btn primary', '출전');
      go.onclick = function () {
        if (!chosen.length) { G.App.toast('최소 1명은 출전해야 합니다.'); return; }
        s.lastParty = chosen.slice();
        self.start(battleId, chosen.slice());
      };
      var note = el('button', 'btn', '수첩'); note.onclick = function () { G.App.openNotebook(); };
      var help = el('button', 'btn', '전투 규칙'); help.onclick = function () { G.App.openHelp(); };
      var set = el('button', 'btn', '설정'); set.onclick = function () { G.App.openSettings(); };
      [help, note, set, go].forEach(function (b) { foot.appendChild(b); });
      scr.appendChild(foot);
      scr.scrollTop = 0;
    },

    // ======================================================= 전투 시작
    start: function (battleId, ids) {
      var App = G.App, story = App.story, d = D();
      this.id = battleId;
      this.partyIds = ids;
      this.eng = new G.Battle(battleId, {
        party: story.partySpec(ids), difficulty: story.state.difficulty,
        check: function (expr) { return story.test(expr); }
      });
      this.disp = null; this.sel = null; this.selSkill = null; this.busy = false; this.log = [];
      this.gen = (this.gen || 0) + 1;
      App.show('battle');
      this.build();
      this.nextTurn();
    },

    build: function () {
      var self = this, def = D().battles[this.id], scr = $('#battle-screen');
      scr.innerHTML = '';
      var bg = el('div', 'b-bg');
      var bgi = D().backgrounds[def.bg] || { name: '', color: '#222' };
      G.Assets.fill(bg, 'assets/bg/' + def.bg + '.png', '', bgi.color);
      scr.appendChild(bg);
      var head = el('div', 'b-head');
      head.innerHTML = '<div class="title">' + U.esc(def.name) + '</div><div class="turn" id="b-turn"></div>';
      var spd = el('button', 'btn small', '');
      var setSpd = function () { var v = G.App.settings.battleSpeed; spd.textContent = '연출 ' + (v === 0 ? '즉시' : v + '배'); };
      setSpd();
      spd.onclick = function () {
        var order = [1, 2, 4, 0], v = G.App.settings.battleSpeed;
        G.App.settings.battleSpeed = order[(order.indexOf(v) + 1) % order.length];
        G.App.saveSettings(); setSpd();
      };
      var auto = el('button', 'btn small', '자동 전투');
      auto.id = 'b-autobattle';
      auto.onclick = function () {
        self.autoBattle = !self.autoBattle;
        auto.classList.toggle('primary', self.autoBattle);
        if (self.autoBattle && !self.busy) self.execute(true);
      };
      if (this.autoBattle) auto.classList.add('primary');
      var logb = el('button', 'btn small', '로그'); logb.onclick = function () { self.openLog(); };
      var menu = el('button', 'btn small', '메뉴'); menu.onclick = function () { self.openMenu(); };
      [spd, auto, logb, menu].forEach(function (b) { head.appendChild(b); });
      scr.appendChild(head);
      var main = el('div', 'b-main');
      main.appendChild(el('div', 'b-row', '')).id = 'b-enemies';
      var mid = el('div', 'b-mid'); mid.id = 'b-mid';
      main.appendChild(mid);
      main.appendChild(el('div', 'b-row', '')).id = 'b-allies';
      scr.appendChild(main);
      var hand = el('div', 'b-hand'); hand.id = 'b-hand';
      scr.appendChild(hand);
      var foot = el('div', 'b-foot');
      foot.innerHTML = '<div class="harm" id="b-harm"></div>';
      var ap = el('button', 'btn', '자동 편성'); ap.onclick = function () { if (self.busy) return; self.eng.autoPlan(true); self.pickNext(); self.render(); };
      var rs = el('button', 'btn', '초기화'); rs.onclick = function () { if (self.busy) return; self.eng.plans = {}; self.restorePanic(); self.sel = null; self.selSkill = null; self.pickNext(); self.render(); };
      var go = el('button', 'btn primary', '전투 개시'); go.id = 'b-go'; go.onclick = function () { self.execute(false); };
      [ap, rs, go].forEach(function (b) { foot.appendChild(b); });
      scr.appendChild(foot);
    },

    restorePanic: function () {
      // 공황 아군의 무작위 계획은 초기화로 지우지 않는다
      var e = this.eng;
      if (!this._panicPlans) return;
      Object.keys(this._panicPlans).forEach(function (k) { e.plans[k] = this._panicPlans[k]; }, this);
    },

    nextTurn: function () {
      var self = this;
      var ev = this.eng.startTurn();
      this._panicPlans = U.clone(this.eng.plans);
      this.sel = null; this.selSkill = null;
      this.play(ev, function () {
        self.pickNext();
        self.render();
        if (self.autoBattle) self.later(function () { self.execute(true); }, 250);
      });
    },

    later: function (fn, ms) { setTimeout(fn, ms); },

    pickNext: function () {
      var e = this.eng;
      var ready = e.readyAllies().filter(function (u) { return !u.panic; });
      ready.sort(function (a, b) { return b.dice[0].speed - a.dice[0].speed; });
      var next = ready.filter(function (u) { return !e.plans[u.uid]; })[0];
      this.sel = next ? next.uid : (this.sel && e.unit(this.sel) && !e.unit(this.sel).dead ? this.sel : (ready[0] ? ready[0].uid : null));
      this.selSkill = null;
    },

    // ======================================================= 렌더
    dv: function (u) {
      // 연출 중에는 표시용 상태를 사용
      if (this.disp && this.disp[u.uid]) return this.disp[u.uid];
      var st = {};
      Object.keys(u.st).forEach(function (k) { if (u.st[k]) st[k] = u.st[k]; });
      Object.keys(u.nx).forEach(function (k) { if (u.nx[k]) st[k] = (st[k] || 0) + u.nx[k]; });
      return { hp: u.hp, resolve: u.resolve, glow: u.glow, st: st, broken: this.eng.isBroken(u), dead: u.dead, panic: u.panic };
    },

    snapshot: function () {
      var self = this, out = {};
      this.eng.units.forEach(function (u) { out[u.uid] = U.clone(self.dv(u)); });
      return out;
    },

    render: function () {
      var e = this.eng;
      $('#b-turn').textContent = '제 ' + e.turn + ' 턴';
      var engs = this.busy ? null : e.computeEngagements();
      this.renderRow('#b-enemies', e.enemies(), engs);
      this.renderRow('#b-allies', e.allies(), engs);
      this.renderHand();
      var h = e.computeHarmony();
      $('#b-harm').innerHTML = h.groups.length ? '화음 · ' + h.groups.map(function (g) { return elemTag(g.element) + ' ×' + g.size + ' (+' + (g.size - 1) + ')'; }).join(' · ') : '<span class="hint">같은 속성 기술 2장 이상 → 화음</span>';
      var go = $('#b-go');
      if (go) { go.disabled = this.busy; go.classList.toggle('primary', !this.busy); }
    },

    renderRow: function (sel, units, engs) {
      var self = this, row = $(sel);
      row.innerHTML = '';
      units.forEach(function (u) { row.appendChild(self.unitCard(u, engs)); });
    },

    unitCard: function (u, engs) {
      var self = this, e = this.eng, d = D(), v = this.dv(u);
      var card = el('div', 'ucard ' + u.side + (u.tier === 'boss' ? ' boss' : '') + (u.tier === 'part' ? ' part' : '') + (v.dead ? ' dead' : '') + (this.sel === u.uid ? ' sel' : ''));
      card.setAttribute('data-uid', u.uid);
      var top = el('div', 'top');
      var pt = el('div', 'pt');
      if (u.side === 'ally') G.Assets.fillChar(pt, u.id, 'normal', u.name, u.color, 'bust');
      else G.Assets.fill(pt, u.portrait, u.name, u.color);
      top.appendChild(pt);
      var nm = el('div', '');
      var sub = u.side === 'ally' ? elemTag(u.element) : ({ mob: '일반', elite: '정예', boss: '보스', part: '부위' }[u.tier] || '') + (u.intercept ? ' · 반격 태세' : '');
      nm.innerHTML = '<div class="nm">' + U.esc(u.name) + '</div><div class="sub">' + sub + '</div>';
      top.appendChild(nm);
      card.appendChild(top);
      // 체력
      var hpPct = Math.max(0, v.hp) / u.maxHp * 100;
      var hp = el('div', 'bar hp', '<i style="width:' + hpPct + '%"></i>');
      u.breaks.forEach(function (b) { var m = el('div', 'brk'); m.style.left = (b / u.maxHp * 100) + '%'; hp.appendChild(m); });
      card.appendChild(hp);
      card.appendChild(el('div', 'bar-txt', '<span>' + Math.max(0, Math.round(v.hp)) + ' / ' + u.maxHp + '</span><span>심지 ' + (v.resolve > 0 ? '+' : '') + v.resolve + '</span>'));
      var res = el('div', 'bar res', '<i></i><div class="knob" style="left:' + ((v.resolve + 45) / 90 * 100) + '%"></div>');
      card.appendChild(res);
      if (u.side === 'ally') {
        card.appendChild(el('div', 'bar glow' + (v.glow >= 100 ? ' full' : ''), '<i style="width:' + v.glow + '%"></i>'));
      }
      // 상태
      var sts = el('div', 'sts');
      Object.keys(v.st || {}).forEach(function (k) {
        if (!v.st[k]) return;
        var info = d.statuses[k] || { name: k };
        var ico = info.icon && G.Assets.listed(info.icon) ? '<img src="' + info.icon + '" alt="">' : '';
        var s = el('span', 'st', ico + U.esc(info.name) + ' ' + v.st[k]);
        s.title = info.desc || '';
        s.style.borderLeft = '3px solid ' + (info.color || '#888');
        sts.appendChild(s);
      });
      if (u.side === 'ally' && Object.keys(u.sealed).length) {
        Object.keys(u.sealed).forEach(function (sid) { sts.appendChild(el('span', 'st', '봉인: ' + U.esc((e.skill(sid) || {}).name))); });
      }
      card.appendChild(sts);
      var fico = function (k) { var i = d.statuses[k].icon; return G.Assets.listed(i) ? '<img src="' + i + '" alt="" style="width:11px;height:11px;vertical-align:middle;margin-right:2px">' : ''; };
      if (v.broken && !v.dead) card.appendChild(el('div', 'flag broken', fico('broken') + '자세 붕괴'));
      else if (v.panic && !v.dead) card.appendChild(el('div', 'flag panic', fico('panic') + '공황'));

      if (u.side === 'enemy') {
        var dice = el('div', 'dice');
        e.enemyActions.filter(function (a) { return a.uid === u.uid; }).forEach(function (a) {
          if (v.dead) return;
          var sk = e.skill(a.skill), tgt = e.unit(a.target);
          var claimed = engs && engs.redirect[a.uid + ':' + a.die];
          var die = el('div', 'die' + (claimed ? ' claimed' : '') + (self.selSkill && !self.busy ? ' targetable' : ''));
          var tline = '→ ' + U.esc(tgt ? tgt.name : '?');
          if (claimed) tline = '⇄ ' + U.esc(e.unit(claimed).name) + ' <span class="hint">(원래 ' + U.esc(tgt.name) + ')</span>';
          die.innerHTML = '<div class="spd">' + a.speed + '</div><div class="sk"><div>' + U.esc(sk.name) + ' <span class="e">' + elemTag(sk.element) + '</span></div>' +
            '<div class="hint">' + skillLine(sk) + ' ' + tline + '</div></div>';
          die.title = sk.desc || '';
          die.onclick = function (ev) { ev.stopPropagation(); self.target(u.uid, a.die); };
          dice.appendChild(die);
        });
        if (!v.dead && !e.enemyActions.some(function (a) { return a.uid === u.uid; }) && !this.busy) {
          var idle = el('div', 'die' + (this.selSkill ? ' targetable' : ''), '<div class="spd">-</div><div class="sk hint">' + (v.broken ? '행동 불가 — 일방 공격 가능' : '행동 없음') + '</div>');
          idle.onclick = function (ev) { ev.stopPropagation(); self.target(u.uid, -1); };
          dice.appendChild(idle);
        }
        card.appendChild(dice);
        card.onclick = function () { if (self.selSkill && !v.dead) self.target(u.uid, -1); else if (u.desc) G.App.toast(u.name + ': ' + u.desc); };
      } else {
        var spdTxt = u.dice.length ? '속도 ' + u.dice[0].speed : (v.broken ? '행동 불가' : '');
        var plan = el('div', 'plan');
        var p = e.plans[u.uid];
        if (!this.busy && p && engs) {
          var m = engs.modes[u.uid];
          if (p.skill === 'guard') { plan.className = 'plan guard'; plan.innerHTML = spdTxt + ' · 🛡 수비'; }
          else if (m) {
            var sk = e.skill(p.skill);
            var tn = e.unit(p.target.uid).name;
            var h = e.computeHarmony().bonus[u.uid] || 0;
            if (m.mode === 'onesided') {
              plan.className = 'plan onesided';
              var why = m.slower && m.ea && m.ea.target !== u.uid ? ' <span class="hint">(느려서 막지 못함)</span>' : (m.claimedBy ? ' <span class="hint">(이미 다른 동료가 격돌)</span>' : '');
              plan.innerHTML = spdTxt + ' · ' + U.esc(sk.name) + ' → ' + U.esc(tn) + ' 일방 공격' + why;
            } else {
              var wr = Math.round(e.winRate(u, p.skill, m.ea, h) * 100);
              plan.className = 'plan ' + (m.mode === 'counter' ? 'warn' : 'clash');
              var lab = { clash: '격돌', intercept: '가로채기', counter: '적이 가로챔' }[m.mode];
              plan.innerHTML = spdTxt + ' · ' + U.esc(sk.name) + ' ⚔ ' + U.esc(tn) + ' ' + lab + ' · 승률 ' + wr + '%';
            }
            if (p.auto) plan.innerHTML += ' <span class="hint">(공황)</span>';
          }
        } else if (!this.busy) {
          plan.innerHTML = spdTxt + (u.dice.length && !v.dead ? ' · <span class="hint">행동 미지정</span>' : '');
        } else plan.innerHTML = spdTxt;
        card.appendChild(plan);
        card.onclick = function () {
          if (self.busy || v.dead || !u.dice.length || u.panic) return;
          self.sel = u.uid; self.selSkill = null; self.render();
        };
      }
      return card;
    },

    renderHand: function () {
      var self = this, e = this.eng, box = $('#b-hand');
      box.innerHTML = '';
      var u = this.sel && e.unit(this.sel);
      if (this.busy || !u || u.dead || !u.dice.length) {
        box.innerHTML = '<div class="who"><span class="hint">' + (this.busy ? '…' : '행동할 수 있는 동료가 없다. [전투 개시]') + '</span></div>';
        return;
      }
      var who = el('div', 'who', '<span>' + U.esc(u.name) + ' · 속도 ' + u.dice[0].speed + ' · 잔광 ' + u.glow + '/100</span><span class="hint">' +
        (this.selSkill ? '이제 적의 행동(주사위)이나 적을 누르세요' : '기술을 고르세요 (1~4)') + '</span>');
      box.appendChild(who);
      var cards = el('div', 'cards');
      var opts = e.handOptions(u).concat(['guard']);
      opts.forEach(function (sid, i) {
        var isGuard = sid === 'guard';
        var sk = isGuard ? e.skill(u.guard) : e.skill(sid);
        var c = el('div', 'scard' + (self.selSkill === sid ? ' sel' : '') + (sid === u.ult ? ' ult' : ''));
        c.innerHTML = '<div class="sn">' + (i + 1) + '. ' + (isGuard ? '수비 · ' : '') + U.esc(sk.name) + '</div>' +
          '<div>' + elemTag(sk.element) + ' <span class="sp">위력 ' + skillLine(sk) + '</span></div>' +
          '<div class="sd">' + U.esc(sk.desc || '') + '</div>';
        c.onclick = function () { self.pickSkill(sid); };
        cards.appendChild(c);
      });
      box.appendChild(cards);
    },

    pickSkill: function (sid) {
      if (this.busy || !this.sel) return;
      if (sid === 'guard') {
        this.eng.setPlan(this.sel, { skill: 'guard' });
        this.pickNext(); this.render(); return;
      }
      this.selSkill = sid;
      this.render();
    },

    target: function (uid, die) {
      if (this.busy || !this.sel || !this.selSkill) return;
      var ok = this.eng.setPlan(this.sel, { skill: this.selSkill, target: { uid: uid, die: die } });
      if (!ok) { G.App.toast('그 대상은 고를 수 없다.'); return; }
      this.pickNext();
      this.render();
    },

    onKey: function (e) {
      if (this.busy) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 5) {
        var u = this.sel && this.eng.unit(this.sel);
        if (!u) return;
        var opts = this.eng.handOptions(u).concat(['guard']);
        if (opts[n - 1]) this.pickSkill(opts[n - 1]);
      } else if (e.key === 'q' || e.key === 'Q') { this.eng.autoPlan(true); this.pickNext(); this.render(); }
      else if (e.key === 'Enter') { e.preventDefault(); this.execute(false); }
    },

    // ======================================================= 실행 / 연출
    execute: function (auto) {
      if (this.busy || !this.eng || this.eng.result) return;
      var self = this, e = this.eng;
      if (auto) e.autoPlan(true);
      else if (!e.allPlanned()) {
        var missing = e.readyAllies().filter(function (u) { return !e.plans[u.uid]; }).map(function (u) { return u.name; });
        if (missing.length && !confirm(missing.join(', ') + '의 행동이 없습니다. 수비로 두고 진행할까요?')) return;
      }
      this.busy = true;
      this.disp = this.snapshot();
      this.render();
      var ev = e.resolveTurn();
      this.play(ev, function () {
        self.disp = null;
        self.busy = false;
        if (e.result) { self.render(); self.finish(); return; }
        self.nextTurn();
      });
    },

    delay: function (ms) {
      var sp = G.App.settings.battleSpeed;
      if (sp === 0) return 0;
      return ms / sp;
    },

    cardEl: function (uid) { return document.querySelector('.ucard[data-uid="' + uid + '"]'); },
    pop: function (uid, text, cls) {
      var c = this.cardEl(uid);
      if (!c) return;
      var p = el('div', 'dmg-pop ' + (cls || ''), U.esc(String(text)));
      c.appendChild(p);
      setTimeout(function () { p.remove(); }, 850);
    },
    mid: function (html, cls) {
      var m = $('#b-mid');
      if (!m) return;
      m.innerHTML = '';
      if (html) m.appendChild(el('div', 'b-msg ' + (cls || ''), html));
    },
    note: function (text) { this.log.push(text); if (this.log.length > 400) this.log.shift(); },

    play: function (events, done) {
      var self = this, i = 0, e = this.eng, gen = this.gen;
      var name = function (uid) { var u = e.unit(uid); return u ? u.name : '?'; };
      var clash = null;
      var dsp = this.disp || this.snapshot();
      if (!this.disp) this.disp = dsp;
      var next = function () {
        if (gen !== self.gen || G.App.screen !== 'battle') return; // 전투를 떠났다
        if (i >= events.length) { self.mid(''); self.disp = self.busy ? self.disp : null; done(); return; }
        var ev = events[i++], wait = 0;
        var D0 = dsp[ev.uid];
        switch (ev.t) {
          case 'turnStart': self.render(); self.mid('제 ' + ev.turn + ' 턴', 'big'); wait = 550; self.note('── 제 ' + ev.turn + ' 턴 ──'); break;
          case 'text': self.mid((ev.speaker ? '<span class="sp">' + U.esc(ev.speaker) + '</span>' : '') + U.esc(ev.text)); wait = 1300; self.note((ev.speaker ? ev.speaker + ': ' : '') + ev.text); break;
          case 'panic': if (D0) D0.panic = true; self.render(); self.mid(U.esc(name(ev.uid)) + ' — 공황!', 'big'); wait = 700; self.note(name(ev.uid) + ' 공황'); break;
          case 'panicEnd': if (D0) D0.panic = false; break;
          case 'seal': self.mid(U.esc(name(ev.uid)) + '의 「' + U.esc(e.skill(ev.skill).name) + '」 봉인'); wait = 600; self.note(name(ev.uid) + ' 기술 봉인: ' + e.skill(ev.skill).name); break;
          case 'guardUp': self.note(name(ev.uid) + ' 수비 태세'); break;
          case 'harmony': self.mid('화음 · ' + elemTag(ev.element) + ' ×' + ev.size, 'big'); wait = 650; self.note('화음 ' + D().elements[ev.element].name + ' ×' + ev.size); break;
          case 'intercept': self.mid(U.esc(name(ev.uid)) + '이(가) ' + U.esc(name(ev.from)) + '을(를) 노린 공격을 가로챘다!'); wait = 600; self.note(name(ev.uid) + ' 가로채기'); break;
          case 'counter': self.mid(U.esc(name(ev.uid)) + '의 반격 태세! 공격을 가로챘다.'); wait = 600; self.note(name(ev.uid) + ' 반격 태세'); break;
          case 'clashStart':
            clash = { a: ev.a, b: ev.b, as: e.skill(ev.askill), bs: e.skill(ev.bskill), al: ev.alamps, bl: ev.blamps, amax: ev.alamps, bmax: ev.blamps, af: [], bf: [], ap: '-', bp: '-' };
            self.drawClash(clash, name);
            self.hl([ev.a, ev.b]);
            wait = 450; self.note('격돌: ' + name(ev.a) + '「' + clash.as.name + '」 vs ' + name(ev.b) + '「' + clash.bs.name + '」');
            break;
          case 'clashRound':
            if (clash) {
              clash.ap = ev.ap; clash.bp = ev.bp; clash.af = ev.af; clash.bf = ev.bf;
              clash.al = ev.alamps; clash.bl = ev.blamps; clash.lastLoser = ev.loser;
              self.drawClash(clash, name);
            }
            wait = 520;
            break;
          case 'clashEnd':
            if (clash) { clash.winner = ev.winner; self.drawClash(clash, name); }
            wait = 420; self.note('→ ' + name(ev.winner) + ' 승리 (격돌 ' + ev.rounds + '회)');
            break;
          case 'attackStart':
            self.hl([ev.uid, ev.target]);
            if (ev.oneSided) { self.mid(U.esc(name(ev.uid)) + ' — 「' + U.esc(e.skill(ev.skill).name) + '」 → ' + U.esc(name(ev.target))); wait = 350; }
            self.note(name(ev.uid) + '「' + e.skill(ev.skill).name + '」 → ' + name(ev.target) + (ev.oneSided ? ' (일방)' : ''));
            break;
          case 'hit':
            if (dsp[ev.target]) dsp[ev.target].hp -= ev.dmg;
            if (ev.dmg > 0) self.pop(ev.target, ev.dmg + (ev.heads ? '' : ''), '');
            if (ev.blocked) self.pop(ev.target, '흡수 ' + ev.blocked, 'block');
            self.updateCard(ev.target);
            var c = self.cardEl(ev.target); if (c) { c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); }
            wait = 300; self.note('  등불 ' + (ev.lamp + 1) + (ev.heads ? ' 점화' : ' 불발') + ' 위력 ' + ev.power + ' → ' + ev.dmg + ' 피해' + (ev.blocked ? ' (흡수 ' + ev.blocked + ')' : ''));
            break;
          case 'guard': self.pop(ev.uid, '수비 ' + ev.power, 'block'); wait = 250; break;
          case 'heal': if (D0) D0.hp = ev.hp; self.pop(ev.uid, '+' + ev.n, 'heal'); self.updateCard(ev.uid); wait = 200; self.note(name(ev.uid) + ' 체력 +' + ev.n); break;
          case 'dot': if (D0) D0.hp -= ev.dmg; self.pop(ev.uid, ev.dmg, ''); self.updateCard(ev.uid); wait = 250; self.note(name(ev.uid) + ' ' + ((D().statuses[ev.status] || {}).name || '') + ' 피해 ' + ev.dmg); break;
          case 'status': if (D0) { D0.st[ev.status] = ev.total; self.updateCard(ev.uid); } self.note(name(ev.uid) + ' ' + ((D().statuses[ev.status] || {}).name || ev.status) + ' ' + ev.n); break;
          case 'resolve': if (D0) { D0.resolve = ev.value; self.updateCard(ev.uid); } self.note(name(ev.uid) + ' 심지 ' + (ev.delta > 0 ? '+' : '') + ev.delta + (ev.why ? ' (' + ev.why + ')' : '')); break;
          case 'break': if (D0) D0.broken = true; self.updateCard(ev.uid); self.pop(ev.uid, '자세 붕괴!', 'block'); wait = 500; self.note(name(ev.uid) + ' 자세 붕괴'); break;
          case 'recover': if (D0) D0.broken = false; self.note(name(ev.uid) + ' 자세 회복'); break;
          case 'death': if (D0) { D0.dead = true; D0.hp = 0; } self.updateCard(ev.uid); wait = 450; self.note(name(ev.uid) + ' 쓰러짐'); break;
          case 'partBreak': self.mid(U.esc(name(ev.uid)) + ' 파괴!', 'big'); wait = 600; break;
          case 'phase': self.mid((ev.name ? '【' + U.esc(ev.name) + '】 ' : '') + U.esc(ev.text), 'big'); self.updateCard(ev.uid); wait = 1600; self.note('★ ' + ev.text); break;
          case 'ult':
            self.note('극의! ' + name(ev.uid) + '「' + e.skill(ev.skill).name + '」');
            var uu = e.unit(ev.uid);
            G.App.cutin(uu.id, e.skill(ev.skill).name, function () { next(); });
            return;
          case 'end': break;
        }
        if (ev.t === 'clashEnd' || (ev.t === 'attackStart' && !ev.oneSided)) { /* 패널 유지 */ }
        var w = self.delay(wait);
        if (w <= 0) next(); else setTimeout(next, w);
      };
      next();
    },

    hl: function (uids) {
      document.querySelectorAll('.ucard.hl').forEach(function (c) { c.classList.remove('hl'); });
      uids.forEach(function (u) { var c = this.cardEl(u); if (c) c.classList.add('hl'); }, this);
    },

    updateCard: function (uid) {
      var u = this.eng.unit(uid), old = this.cardEl(uid);
      if (!u || !old) return;
      var nu = this.unitCard(u, null);
      if (old.classList.contains('hl')) nu.classList.add('hl');
      old.querySelectorAll('.dmg-pop').forEach(function (p) { nu.appendChild(p); });
      old.replaceWith(nu);
    },

    drawClash: function (c, name) {
      function lamps(max, left, flips) {
        var h = '<div class="lamps">';
        for (var i = 0; i < max; i++) {
          var cls = i >= left ? 'gone' : (flips && i < flips.length ? (flips[i] ? 'on' : 'off') : '');
          h += '<span class="lamp ' + cls + '"></span>';
        }
        return h + '</div>';
      }
      var m = $('#b-mid');
      m.innerHTML = '';
      var p = el('div', 'clash-panel');
      p.innerHTML =
        '<div class="side' + (c.winner === c.a ? ' win' : '') + '"><div class="n">' + U.esc(name(c.a)) + '</div><div class="k">' + U.esc(c.as.name) + '</div><div class="p">' + c.ap + '</div>' + lamps(c.amax, c.al, c.af) + '</div>' +
        '<div class="vs">격돌</div>' +
        '<div class="side' + (c.winner === c.b ? ' win' : '') + '"><div class="n">' + U.esc(name(c.b)) + '</div><div class="k">' + U.esc(c.bs.name) + '</div><div class="p">' + c.bp + '</div>' + lamps(c.bmax, c.bl, c.bf) + '</div>';
      m.appendChild(p);
    },

    // ======================================================= 결과
    finish: function () {
      var self = this, e = this.eng, App = G.App, d = D();
      var def = d.battles[this.id];
      var win = e.result === 'win';
      var body = el('div', 'b-result ' + (win ? 'win' : 'lose'));
      body.innerHTML = '<h2>' + (win ? '승리' : '패배') + '</h2><p>' + e.turn + '턴 · 격돌 ' + e.stats.clashWin + '승 ' + e.stats.clashLose + '패' +
        (win && def.reward ? ' · 성흔 파편 +' + def.reward : '') + '</p>' +
        (win ? '' : '<p class="hint">편성이나 각인을 바꾸거나, 난이도를 낮춰 다시 도전할 수 있습니다.</p>');
      var foot = el('div');
      foot.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end';
      function btn(label, fn, cls) { var b = el('button', 'btn ' + (cls || ''), label); b.onclick = fn; foot.appendChild(b); }
      this.autoBattle = false;
      if (win) {
        btn('계속', function () { App.closeOverlay(); App.returnFromBattle(true, { id: self.id, turns: e.turn }); }, 'primary');
        App.modal('전투 종료', body, foot, { noClose: true, onKey: function () { App.closeOverlay(); App.returnFromBattle(true, { id: self.id, turns: e.turn }); } });
      } else {
        btn('같은 편성으로 재도전', function () { App.closeOverlay(); self.start(self.id, self.partyIds); }, 'primary');
        btn('편성 다시', function () { App.closeOverlay(); self.openFormation(self.id); });
        if (App.story.state.difficulty !== 'easy') {
          btn('쉬움으로 낮추고 재도전', function () { App.story.state.difficulty = 'easy'; App.closeOverlay(); self.start(self.id, self.partyIds); });
        }
        btn('타이틀로', function () { App.closeOverlay(); App.renderTitle(); });
        App.modal('전투 종료', body, foot, { noClose: true });
      }
    },

    openLog: function () {
      var body = el('div', 'b-log');
      this.log.slice(-250).forEach(function (l) { body.appendChild(el('div', '', U.esc(l))); });
      var b = G.App.modal('전투 로그', body);
      b.scrollTop = b.scrollHeight;
    },

    openMenu: function () {
      var self = this, App = G.App;
      var body = el('div');
      body.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      [['계속하기', function () { App.closeOverlay(); }],
        ['전투 규칙', function () { App.openHelp(); }],
        ['설정', function () { App.openSettings(); }],
        ['처음부터 다시 (편성 화면)', function () { App.closeOverlay(); self.autoBattle = false; self.busy = false; self.openFormation(self.id); }],
        ['타이틀로', function () { if (confirm('전투 직전 자동 저장으로 돌아갑니다. 타이틀로 갈까요?')) { self.autoBattle = false; App.renderTitle(); } }]
      ].forEach(function (x) { var b = el('button', 'btn', x[0]); b.onclick = x[1]; body.appendChild(b); });
      App.modal('전투 메뉴', body);
    }
  };
})(window);
