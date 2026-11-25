/* 화면 UI: 타이틀, 스토리(대사·선택지·연출), 오버레이(로그·세이브·설정·수첩·메뉴), 엔딩 */
(function (root) {
  'use strict';
  var G = root.Game, U = G.util, D = function () { return root.GameData; };

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  G.dom = { $: $, el: el };

  var EXPR = { normal: '기본', smile: '미소', angry: '분노', sad: '슬픔', surprised: '놀람', blank: '무표정', cold: '냉정', scared: '겁먹음' };
  var POS = { LL: 12, L: 24, C: 50, R: 76, RR: 88 };

  function charInfo(id) {
    var d = D();
    return d.characters[id] || d.npcs[id] || { name: id, color: '#556' };
  }

  var App = G.App = {
    story: null, script: null, settings: null, screen: 'title',
    auto: false, skip: false, ctrlSkip: false,
    typing: false, cur: null, backlog: [], timers: [],

    // ========================================================= 초기화
    init: function () {
      this.settings = G.Save.settings();
      try { this.script = new G.Script(D()); }
      catch (e) { console.error(e); alert('시나리오 파싱 오류: ' + e.message); return; }
      this.bind();
      this.renderTitle();
      var self = this;
      setInterval(function () {
        if (self.story && (self.screen === 'story' || self.screen === 'battle' || self.screen === 'formation') &&
            (typeof document === 'undefined' || !document.hidden)) self.story.state.playtime++;
      }, 1000);
    },

    show: function (name) {
      this.screen = name;
      ['title', 'story', 'formation', 'battle'].forEach(function (n) {
        var s = $('#' + n + '-screen');
        if (s) s.classList.toggle('hidden', n !== name);
      });
    },

    bind: function () {
      var self = this;
      $('#dialog').addEventListener('click', function (e) { e.stopPropagation(); self.onClick(); });
      $('#story-screen').addEventListener('click', function (e) {
        if (e.target.closest('#quick-menu') || e.target.closest('#choice-layer')) return;
        self.onClick();
      });
      $('#quick-menu').addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        e.stopPropagation();
        self.quick(b.getAttribute('data-q'));
      });
      document.addEventListener('keydown', function (e) { self.onKey(e, true); });
      document.addEventListener('keyup', function (e) { self.onKey(e, false); });
      window.addEventListener('beforeunload', function () { G.Save.flushRead(); });
    },

    onKey: function (e, down) {
      var ov = !$('#overlay').classList.contains('hidden');
      if (e.key === 'Control') {
        if (this.screen === 'story' && !ov) { this.ctrlSkip = down; if (down) this.tryFastForward(); }
        return;
      }
      if (!down) return;
      if (e.key === 'Escape') {
        if (ov) { if (this._overlayClose) this._overlayClose(); else this.closeOverlay(); }
        else if (this.screen === 'story') this.openMenu();
        else if (this.screen === 'battle' && G.BattleUI) G.BattleUI.openMenu();
        e.preventDefault();
        return;
      }
      if (ov) {
        if ((e.key === ' ' || e.key === 'Enter') && this._overlayKey) { e.preventDefault(); this._overlayKey(); }
        return;
      }
      if (this.screen === 'battle' && G.BattleUI) { G.BattleUI.onKey(e); return; }
      if (this.screen !== 'story') return;
      var choiceOpen = !$('#choice-layer').classList.contains('hidden');
      if (choiceOpen) {
        var n = parseInt(e.key, 10);
        if (n >= 1) { var bs = document.querySelectorAll('#choice-layer .choice'); if (bs[n - 1]) bs[n - 1].click(); }
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.onClick(); }
      else if (e.key === 'a' || e.key === 'A') this.quick('auto');
      else if (e.key === 'l' || e.key === 'L') this.quick('log');
      else if (e.key === 'n' || e.key === 'N') this.quick('notebook');
      else if (e.key === 's' || e.key === 'S') this.quick('skip');
    },

    // ========================================================= 타이틀
    renderTitle: function () {
      var self = this;
      this.stopFlow();
      this.closeOverlay();
      this.show('title');
      G.Assets.fill($('#title-bg'), 'assets/title/title_bg.png', '', '#1a1a24');
      var logo = $('#title-logo');
      G.Assets.probe('assets/title/logo.png', function (ok) {
        if (ok) { logo.innerHTML = '<img src="assets/title/logo.png" alt="잿빛 매와 별의 장부" style="max-width:100%">'; }
      });
      var m = $('#title-menu');
      m.innerHTML = '';
      var latest = G.Save.latest();
      function add(label, fn, cls) { var b = el('button', 'btn ' + (cls || ''), label); b.onclick = fn; m.appendChild(b); return b; }
      if (latest) add('이어하기', function () { self.loadSlot(latest.slot); }, 'primary');
      add('새로 시작', function () { self.chooseDifficulty(); }, latest ? '' : 'primary');
      add('불러오기', function () { self.openSaveLoad('load'); });
      add('설정', function () { self.openSettings(); });
      add('엔딩 기록', function () { self.openEndings(); });
      add('조작법 · 전투 규칙', function () { self.openHelp(); });
    },

    chooseDifficulty: function () {
      var self = this, d = D().difficulty;
      var body = el('div');
      body.appendChild(el('p', 'hint', '난이도는 게임 중 설정에서 언제든 바꿀 수 있습니다. 전투에서 지면 난이도를 낮춰 다시 도전할 수 있습니다.'));
      Object.keys(d).forEach(function (k) {
        var b = el('button', 'btn ' + (k === 'normal' ? 'primary' : ''), '<b>' + d[k].label + '</b> — <span class="hint">' + d[k].desc + '</span>');
        b.style.cssText = 'display:block;width:100%;margin:8px 0;text-align:left';
        b.onclick = function () { self.closeOverlay(); self.newGame(k); };
        body.appendChild(b);
      });
      this.modal('난이도 선택', body);
    },

    newGame: function (diff) {
      this.story = new G.Story(this.script, G.newState(diff), D());
      this.backlog = [];
      this.startStory();
    },

    loadSlot: function (slot) {
      var data = G.Save.read(slot);
      if (!data) { this.toast('빈 슬롯입니다.'); return; }
      this.story = new G.Story(this.script, null, D());
      try { this.story.restore(data.state); }
      catch (e) { console.error(e); this.toast('세이브를 읽지 못했습니다.'); return; }
      this.backlog = data.state.backlog || [];
      delete this.story.state.backlog;
      this.closeOverlay();
      this.startStory();
      this.toast((slot === 'auto' ? '자동 저장' : slot + '번 슬롯') + '에서 불러왔습니다.');
    },

    // ========================================================= 스토리 진행
    startStory: function () {
      var self = this;
      this.stopFlow();
      this.auto = false; this.skip = false;
      this.updateQuick();
      this.story.emit = function (ev, data) { self.onStoryEvent(ev, data); };
      this.show('story');
      this.renderBg(); this.renderCg(); this.renderChars(); this.renderScene();
      this.step();
    },

    stopFlow: function () {
      this.timers.forEach(clearTimeout);
      this.timers = [];
      if (this._raf) cancelAnimationFrame(this._raf);
      this.typing = false;
      this.cur = null;
      this._busy = false;
    },
    later: function (fn, ms) { var t = setTimeout(fn, ms); this.timers.push(t); return t; },

    onStoryEvent: function (ev, data) {
      var d = D();
      if (ev === 'bg') { this.renderBg(); this.renderCg(); }
      else if (ev === 'chars') this.renderChars();
      else if (ev === 'cg') this.renderCg();
      else if (ev === 'scene') this.renderScene();
      else if (ev === 'fx') this.fx(data);
      else if (ev === 'toast') this.toast(data);
      else if (ev === 'autosave') this.autosave();
      else if (ev === 'party') {
        var nm = (d.characters[data.id] || {}).name || data.id;
        var msg = { join: nm + '이(가) 동료가 되었다.', leave: nm + '이(가) 파티를 떠났다.', die: nm + '을(를) 잃었다.',
          away: nm + '이(가) 당분간 함께할 수 없다.', 'return': nm + '이(가) 돌아왔다.' }[data.act];
        if (msg) this.toast(msg);
      }
    },

    step: function () {
      if (!this.story || this.screen !== 'story') return;
      var r, self = this;
      try { r = this.story.run(); }
      catch (e) { console.error(e); this.toast('스크립트 오류: ' + e.message); return; }
      $('#choice-layer').classList.add('hidden');
      switch (r.type) {
        case 'text': this.presentText(r.op); break;
        case 'choice': this.presentChoice(r); break;
        case 'chapter':
          this.autosave();
          this.chapterCard(r, function () { self.story.resume(); self.step(); });
          break;
        case 'battle':
          this.autosave();
          this.skip = false; this.updateQuick();
          G.BattleUI.openFormation(r.id);
          break;
        case 'tip':
          this.skip = false; this.updateQuick();
          this.tipModal(r.text, function () { self.story.resume(); self.step(); });
          break;
        case 'wait':
          this.later(function () { self.story.resume(); self.step(); }, this.isSkipping() ? 0 : r.ms);
          break;
        case 'cutin':
          this.cutin(r.id, null, function () { self.story.resume(); self.step(); });
          break;
        case 'ending': this.showEnding(r.id); break;
        case 'end': this.renderTitle(); break;
      }
    },

    isSkipping: function () { return this.skip || this.ctrlSkip; },

    presentText: function (op) {
      var self = this, d = D();
      this.cur = op;
      var dlg = $('#dialog'), txt = $('#dialog-text'), plate = $('#name-plate');
      dlg.classList.toggle('sys', op.style === 'sys');
      txt.className = op.style || '';
      if (op.name) { plate.textContent = op.name; plate.classList.remove('hidden'); }
      else plate.classList.add('hidden');
      // 화자 강조
      var sid = d.speakers[op.name];
      var shown = this.story.state.shown;
      document.querySelectorAll('#char-layer .char').forEach(function (c) {
        var id = c.getAttribute('data-id');
        var speaking = sid && id === sid;
        c.classList.toggle('speaking', !!speaking);
        c.classList.toggle('dim', !!sid && !speaking && Object.keys(shown).length > 1);
      });
      var read = G.Save.isRead(op.id);
      this.backlog.push({ name: op.name, text: op.text, style: op.style });
      if (this.backlog.length > 400) this.backlog.shift();
      // 스킵 판단
      if (this.isSkipping()) {
        if (read || this.settings.skipUnread) {
          txt.textContent = op.text;
          this.typing = false;
          $('#dialog-next').classList.add('off');
          this.later(function () { self.advance(); }, 35);
          return;
        }
        this.skip = false; this.updateQuick();
      }
      this.typeText(op.text);
    },

    typeText: function (text) {
      var self = this, txt = $('#dialog-text');
      var cps = Number(this.settings.textSpeed);
      $('#dialog-next').classList.add('off');
      if (cps >= 100) { txt.textContent = text; this.onTyped(); return; }
      this.typing = true;
      var t0 = performance.now(), chars = Array.from(text);
      var tick = function (now) {
        if (!self.typing) return;
        var n = Math.floor((now - t0) / 1000 * cps);
        if (n >= chars.length) { txt.textContent = text; self.typing = false; self.onTyped(); return; }
        txt.textContent = chars.slice(0, n).join('');
        self._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    },

    onTyped: function () {
      var self = this;
      $('#dialog-next').classList.remove('off');
      if (this.auto && this.cur) {
        var len = this.cur.text.length;
        var cur = this.cur;
        this.later(function () { if (self.cur === cur && self.auto) self.advance(); }, (Number(this.settings.autoDelay) + len * 0.035) * 1000);
      }
    },

    onClick: function () {
      if (this.screen !== 'story' || !this.cur) return;
      if (!$('#overlay').classList.contains('hidden')) return;
      if (this.skip) { this.skip = false; this.updateQuick(); }
      if (this.typing) {
        this.typing = false;
        if (this._raf) cancelAnimationFrame(this._raf);
        $('#dialog-text').textContent = this.cur.text;
        this.onTyped();
        return;
      }
      this.advance();
    },

    advance: function () {
      if (!this.cur) return;
      G.Save.markRead(this.cur.id);
      this.cur = null;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.story.advance();
      this.step();
    },

    tryFastForward: function () {
      if (this.cur && !this.typing && this.isSkipping() && (G.Save.isRead(this.cur.id) || this.settings.skipUnread)) this.advance();
    },

    presentChoice: function (r) {
      var self = this, layer = $('#choice-layer');
      this.cur = null;
      if (this.skip || this.auto) { this.skip = false; this.auto = false; this.updateQuick(); }
      layer.innerHTML = '';
      layer.appendChild(el('div', 'choice-title', '— 선택 —'));
      r.options.forEach(function (opt, i) {
        var b = el('button', 'choice', '<span class="num">' + (i + 1) + '</span>' + U.esc(opt.text));
        b.style.animationDelay = (i * 0.06) + 's';
        b.onclick = function (e) {
          e.stopPropagation();
          layer.classList.add('hidden');
          self.backlog.push({ name: '', text: '▶ ' + opt.text, style: 'choice-log' });
          self.story.choose(opt);
          self.autosave();
          self.step();
        };
        layer.appendChild(b);
      });
      layer.classList.remove('hidden');
    },

    // ========================================================= 비주얼
    renderBg: function () {
      var s = this.story.state, d = D();
      var id = s.bg || 'black', info = d.backgrounds[id] || { name: id, color: '#222' };
      G.Assets.fill($('#bg-layer'), id === 'black' ? '' : 'assets/bg/' + id + '.png', info.name, info.color);
    },
    renderCg: function () {
      var s = this.story.state, layer = $('#cg-layer'), d = D();
      if (!s.cg) { layer.classList.add('hidden'); return; }
      var info = d.cgs[s.cg] || { name: s.cg, color: '#333' };
      layer.classList.remove('hidden');
      G.Assets.fill(layer, 'assets/cg/' + s.cg + '.png', '[CG] ' + info.name, info.color);
    },
    renderChars: function () {
      var s = this.story.state, layer = $('#char-layer');
      var existing = {};
      layer.querySelectorAll('.char').forEach(function (c) { existing[c.getAttribute('data-id')] = c; });
      Object.keys(s.shown).forEach(function (id) {
        var sh = s.shown[id], info = charInfo(id);
        var c = existing[id] || el('div', 'char');
        c.setAttribute('data-id', id);
        c.style.left = (POS[sh.pos] || 50) + '%';
        G.Assets.fill(c, 'assets/char/' + id + '_' + sh.expr + '.png', info.name + '\n(' + (EXPR[sh.expr] || sh.expr) + ')', info.color);
        if (!existing[id]) layer.appendChild(c);
        delete existing[id];
      });
      Object.keys(existing).forEach(function (k) { existing[k].remove(); });
    },
    renderScene: function () {
      var c = $('#scene-caption'), t = this.story.state.scene;
      if (!t) { c.classList.add('hidden'); return; }
      c.textContent = t;
      c.classList.remove('hidden');
      c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
    },
    fx: function (kind) {
      var f = $('#fx-layer');
      if (kind === 'shake') {
        if (!this.settings.shake) return;
        var s = $('#story-screen'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
        return;
      }
      f.className = 'layer'; void f.offsetWidth; f.classList.add(kind);
      clearTimeout(this._fxT);
      this._fxT = setTimeout(function () { f.className = 'layer'; }, 1700);
    },
    toast: function (msg) {
      var t = el('div', 'toast', U.esc(msg));
      var box = $('#toast-box');
      while (box.children.length >= 3) box.removeChild(box.firstChild);
      box.appendChild(t);
      setTimeout(function () { t.remove(); }, 3300);
    },
    cutin: function (id, caption, cb) {
      var info = charInfo(id), d = D();
      var ult = d.characters[id] ? d.skills[d.characters[id].ult] : null;
      var c = el('div', 'cutin');
      var img = el('div', 'img');
      G.Assets.fill(img, 'assets/cutin/' + id + '_ult.png', '[컷인] ' + info.name, info.color);
      c.appendChild(img);
      c.appendChild(el('div', 'cap', U.esc(caption || (ult ? ult.name : info.name))));
      $('#app').appendChild(c);
      var ms = this.screen === 'battle' && this.settings.battleSpeed > 1 ? 900 : 1500;
      if (this.settings.battleSpeed === 0 && this.screen === 'battle') ms = 500;
      setTimeout(function () { c.remove(); if (cb) cb(); }, ms);
    },

    // ========================================================= 모달
    modal: function (title, body, foot, opts) {
      opts = opts || {};
      var self = this, ov = $('#overlay');
      ov.innerHTML = '';
      var m = el('div', 'modal');
      var h = el('div', 'modal-head');
      h.appendChild(el('h2', '', U.esc(title)));
      var x = el('button', 'btn small', '닫기');
      x.onclick = function () { self.closeOverlay(); if (opts.onClose) opts.onClose(); };
      if (!opts.noClose) h.appendChild(x);
      m.appendChild(h);
      var b = el('div', 'modal-body');
      if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
      m.appendChild(b);
      if (foot) { var f = el('div', 'modal-foot'); f.appendChild(foot); m.appendChild(f); }
      ov.appendChild(m);
      ov.classList.remove('hidden');
      this._overlayClose = opts.noClose ? null : function () { self.closeOverlay(); if (opts.onClose) opts.onClose(); };
      this._overlayKey = opts.onKey || null;
      var armedAt = Date.now() + 250;
      ov.onclick = function (e) { if (e.target === ov && self._overlayClose && Date.now() > armedAt) self._overlayClose(); };
      return b;
    },
    closeOverlay: function () {
      var ov = $('#overlay');
      ov.classList.add('hidden'); ov.innerHTML = ''; ov.onclick = null;
      this._overlayClose = null; this._overlayKey = null;
    },

    quick: function (q) {
      if (q === 'auto') {
        this.auto = !this.auto; this.skip = false; this.updateQuick();
        if (this.auto && this.cur && !this.typing) this.onTyped();
      } else if (q === 'skip') {
        this.skip = !this.skip; this.auto = false; this.updateQuick();
        if (this.skip) {
          if (this.cur && !(G.Save.isRead(this.cur.id) || this.settings.skipUnread)) { this.skip = false; this.updateQuick(); this.toast('아직 읽지 않은 대사입니다.'); }
          else this.tryFastForward();
        }
      } else if (q === 'log') this.openLog();
      else if (q === 'save') this.openSaveLoad('save');
      else if (q === 'load') this.openSaveLoad('load');
      else if (q === 'settings') this.openSettings();
      else if (q === 'notebook') this.openNotebook();
      else if (q === 'menu') this.openMenu();
    },
    updateQuick: function () {
      var self = this;
      document.querySelectorAll('#quick-menu button').forEach(function (b) {
        var q = b.getAttribute('data-q');
        b.classList.toggle('on', (q === 'auto' && self.auto) || (q === 'skip' && self.skip));
      });
    },

    pauseFlow: function () { this.auto = false; this.skip = false; this.updateQuick(); },

    openLog: function () {
      this.pauseFlow();
      var body = el('div');
      this.backlog.slice(-300).forEach(function (l) {
        var line = el('div', 'log-line ' + (l.style || ''));
        line.innerHTML = (l.name ? '<b>' + U.esc(l.name) + '</b>' : '') + U.esc(l.text);
        body.appendChild(line);
      });
      if (!this.backlog.length) body.appendChild(el('p', 'hint', '아직 기록이 없습니다.'));
      var b = this.modal('대사 로그', body);
      b.scrollTop = b.scrollHeight;
    },

    meta: function () {
      var s = this.story.state;
      var cur = this.cur ? this.cur.text : '';
      return { chapter: s.chapterTitle, scene: s.scene, bg: s.bg, line: cur.slice(0, 40), playtime: s.playtime, difficulty: s.difficulty };
    },
    snapshot: function () {
      var st = U.clone(this.story.state);
      st.backlog = this.backlog.slice(-80);
      return st;
    },
    autosave: function () {
      if (!this.story) return;
      G.Save.write('auto', this.snapshot(), this.meta());
    },

    openSaveLoad: function (mode) {
      var self = this, d = D();
      this.pauseFlow();
      var body = el('div');
      if (mode === 'save' && this.screen !== 'story') { this.toast('대화 중에만 저장할 수 있습니다.'); return; }
      G.Save.list().forEach(function (e) {
        if (mode === 'save' && e.slot === 'auto') return;
        var row = el('div', 'slot' + (e.data ? '' : ' empty'));
        var thumb = el('div', 'thumb');
        var bgid = e.data && e.data.meta.bg;
        var info = bgid ? (d.backgrounds[bgid] || {}) : {};
        G.Assets.fill(thumb, bgid && bgid !== 'black' ? 'assets/bg/' + bgid + '.png' : '', info.name || '', info.color || '#222');
        row.appendChild(thumb);
        var inf = el('div', 'info');
        var label = e.slot === 'auto' ? '자동 저장' : '슬롯 ' + e.slot;
        if (e.data) {
          var m = e.data.meta, dt = new Date(e.data.savedAt);
          inf.innerHTML = '<div class="t">' + label + ' · ' + U.esc(m.chapter || '') + '</div>' +
            '<div class="s">' + U.esc(m.scene || '') + (m.line ? ' — ' + U.esc(m.line) : '') + '</div>' +
            '<div class="s">' + dt.toLocaleString() + ' · 플레이 ' + U.fmtTime(m.playtime) + ' · ' + ((d.difficulty[m.difficulty] || {}).label || '') + '</div>';
        } else inf.innerHTML = '<div class="t">' + label + '</div><div class="s">비어 있음</div>';
        row.appendChild(inf);
        if (e.data && e.slot !== 'auto') {
          var del = el('button', 'btn small danger del', '삭제');
          del.onclick = function (ev) { ev.stopPropagation(); if (confirm(label + '을(를) 삭제할까요?')) { G.Save.remove(e.slot); self.openSaveLoad(mode); } };
          row.appendChild(del);
        }
        row.onclick = function () {
          if (mode === 'save') {
            if (e.data && !confirm(label + '에 덮어쓸까요?')) return;
            G.Save.write(e.slot, self.snapshot(), self.meta());
            self.toast(label + '에 저장했습니다.');
            self.openSaveLoad('save');
          } else if (e.data) {
            if (self.screen !== 'title' && !confirm('진행 중인 내용은 저장되지 않습니다. 불러올까요?')) return;
            self.loadSlot(e.slot);
          }
        };
        body.appendChild(row);
      });
      body.appendChild(el('p', 'hint', '자동 저장은 장이 바뀔 때, 전투 직전·직후, 선택지를 고른 직후에 기록됩니다.'));
      this.modal(mode === 'save' ? '저장' : '불러오기', body);
    },

    openSettings: function () {
      var self = this, s = this.settings, d = D();
      this.pauseFlow();
      var body = el('div');
      function row(label, ctl, hint) {
        var r = el('div', 'setting-row');
        r.appendChild(el('label', '', label));
        var c = el('div', 'ctl'); c.appendChild(ctl); r.appendChild(c);
        body.appendChild(r);
        if (hint) body.appendChild(el('div', 'hint', hint));
      }
      function seg(options, cur, fn) {
        var w = el('div', 'seg');
        options.forEach(function (o) {
          var b = el('button', o[0] === cur ? 'on' : '', o[1]);
          b.onclick = function () { fn(o[0]); w.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); };
          w.appendChild(b);
        });
        return w;
      }
      var sp = el('input'); sp.type = 'range'; sp.min = 10; sp.max = 100; sp.value = s.textSpeed;
      var spv = el('span', 'hint', s.textSpeed >= 100 ? '즉시' : s.textSpeed + '자/초');
      sp.oninput = function () { s.textSpeed = +sp.value; spv.textContent = s.textSpeed >= 100 ? '즉시' : s.textSpeed + '자/초'; self.saveSettings(); };
      var w1 = el('div'); w1.appendChild(sp); w1.appendChild(spv);
      row('텍스트 속도', w1);
      var ad = el('input'); ad.type = 'range'; ad.min = 0.3; ad.max = 4; ad.step = 0.1; ad.value = s.autoDelay;
      var adv = el('span', 'hint', s.autoDelay + '초');
      ad.oninput = function () { s.autoDelay = +ad.value; adv.textContent = s.autoDelay + '초'; self.saveSettings(); };
      var w2 = el('div'); w2.appendChild(ad); w2.appendChild(adv);
      row('오토 대기', w2, '오토 모드에서 한 줄을 다 보여준 뒤 기다리는 시간(+글자 수 비례).');
      row('스킵 범위', seg([[false, '읽은 대사만'], [true, '전부']], s.skipUnread, function (v) { s.skipUnread = v; self.saveSettings(); }),
        '기본값은 이미 읽은 대사만 건너뜁니다. 처음 보는 대사에서 스킵이 멈춥니다. (Ctrl을 누르고 있어도 스킵)');
      row('전투 연출', seg([[1, '1배'], [2, '2배'], [4, '4배'], [0, '즉시']], s.battleSpeed, function (v) { s.battleSpeed = v; self.saveSettings(); }));
      row('화면 흔들림', seg([[true, '켜기'], [false, '끄기']], s.shake, function (v) { s.shake = v; self.saveSettings(); }));
      if (this.story) {
        row('난이도', seg(Object.keys(d.difficulty).map(function (k) { return [k, d.difficulty[k].label]; }), this.story.state.difficulty,
          function (v) { self.story.state.difficulty = v; self.toast('난이도: ' + d.difficulty[v].label); }), '다음 전투부터 적용됩니다.');
      }
      var reset = el('button', 'btn small danger', '모든 기록 초기화');
      reset.onclick = function () {
        if (confirm('세이브, 설정, 읽은 대사, 엔딩 기록을 모두 지웁니다. 계속할까요?')) { G.Save.resetAll(); self.settings = G.Save.settings(); self.toast('초기화했습니다.'); self.renderTitle(); }
      };
      row('데이터', reset);
      this.modal('설정', body);
    },
    saveSettings: function () { G.Save.saveSettings(this.settings); },

    openNotebook: function () {
      if (!this.story) return;
      this.pauseFlow();
      var s = this.story.state, d = D();
      var body = el('div', 'note-section');
      body.appendChild(el('p', 'hint', '원래는 「별의 장부」 공략을 적어 두려던 노트다. 지금은 다른 것을 적고 있다.'));
      body.appendChild(el('h3', '', '기록한 이름 (' + s.names.length + ')'));
      var ul = el('ul', 'note-names');
      if (!s.names.length) ul.appendChild(el('li', 'hint', '— 아직 아무 이름도 적지 않았다 —'));
      s.names.forEach(function (n) { ul.appendChild(el('li', '', '✒ ' + U.esc(n))); });
      body.appendChild(ul);
      body.appendChild(el('h3', '', '단서'));
      var cl = el('ul', 'note-clues');
      if (!s.clues.length) cl.appendChild(el('li', 'hint', '— 아직 없음 —'));
      s.clues.forEach(function (c) { cl.appendChild(el('li', '', U.esc(c))); });
      body.appendChild(cl);
      body.appendChild(el('h3', '', '동료'));
      var pt = el('div', 'party-tags');
      Object.keys(d.characters).forEach(function (id) {
        var p = s.party, cls = '', tag = '';
        if (p.dead.indexOf(id) >= 0) { cls = 'dead'; tag = ' (사망)'; }
        else if (p.away.indexOf(id) >= 0) { cls = 'away'; tag = ' (부재)'; }
        else if (p.members.indexOf(id) < 0) { cls = 'away'; tag = ' (미합류)'; }
        var aff = s.vars['aff.' + id] || 0;
        var hearts = id === 'lennox' ? '' : ' ' + (aff > 0 ? '♥'.repeat(Math.min(5, Math.ceil(aff / 2))) : '♡');
        pt.appendChild(el('span', cls, U.esc(d.characters[id].name) + tag + hearts));
      });
      body.appendChild(pt);
      body.appendChild(el('h3', '', '소지품'));
      body.appendChild(el('p', '', '성흔 파편 ' + s.shards + '개 · 플레이 시간 ' + U.fmtTime(s.playtime)));
      this.modal('수첩', body);
    },

    openMenu: function () {
      var self = this;
      this.pauseFlow();
      var body = el('div');
      body.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      [['계속하기', function () { self.closeOverlay(); }],
        ['저장', function () { self.openSaveLoad('save'); }],
        ['불러오기', function () { self.openSaveLoad('load'); }],
        ['수첩', function () { self.openNotebook(); }],
        ['설정', function () { self.openSettings(); }],
        ['조작법 · 전투 규칙', function () { self.openHelp(); }],
        ['타이틀로', function () { if (confirm('저장하지 않은 진행은 자동 저장 지점까지만 남습니다. 타이틀로 갈까요?')) self.renderTitle(); }]
      ].forEach(function (x) { var b = el('button', 'btn', x[0]); b.onclick = x[1]; body.appendChild(b); });
      this.modal('메뉴', body);
    },

    openHelp: function () {
      var html = '<div class="help">' +
        '<h3>조작</h3><ul>' +
        '<li>클릭 / 탭 / 스페이스 / 엔터: 대사 넘기기 (입력 중이면 한 번에 표시)</li>' +
        '<li>Ctrl 누르고 있기 또는 [스킵]: 이미 읽은 대사 건너뛰기</li>' +
        '<li>A: 오토 · L: 로그 · N: 수첩 · Esc: 메뉴 / 창 닫기 · 숫자키: 선택지</li>' +
        '<li>전투: 1·2·3·4 기술 선택 → 적의 행동(주사위)을 클릭 · Q: 자동 편성 · Enter: 전투 개시</li></ul>' +
        '<h3>속도와 가로채기</h3><p>매 턴 모두가 속도 주사위를 굴린다. 적의 행동 칸에는 속도·기술·표적이 보인다. 내 속도가 더 빠르면 다른 동료를 노린 적의 공격을 <b>가로채</b> 격돌할 수 있다. 느리면 일방 공격이 되고, 그 적의 공격은 원래 표적을 그대로 친다. 일부 적은 자기보다 느린 공격을 가로챈다(반격 태세).</p>' +
        '<h3>격돌과 등불</h3><p>맞붙은 두 기술은 각자의 등불을 하나씩 켜 보며 위력을 겨룬다(켜질 확률은 심지가 정한다). 위력 = 기본 위력 + 점화된 등불 × 보너스. 진 쪽은 등불을 하나 잃고, 한쪽 등불이 모두 꺼질 때까지 반복한다. 이긴 쪽은 남은 등불로 공격한다.</p>' +
        '<h3>심지 (-45 ~ +45)</h3><p>심지가 높을수록 등불이 잘 켜진다(0일 때 50%). 격돌 승리, 적 격파, 성가로 오르고 격돌 패배, 동료의 쓰러짐, 일부 적의 기술로 내려간다. -40 이하에서 턴을 맞으면 <b>공황</b>: 무작위로 행동하고 받는 피해가 늘어난다. 이야기 속 선택도 동료의 심지에 영향을 준다.</p>' +
        '<h3>자세 붕괴</h3><p>체력 바의 흰 눈금(구간)에 닿으면 자세가 무너진다. 남은 이번 턴과 다음 턴 동안 행동할 수 없고 받는 피해가 1.5배가 된다.</p>' +
        '<h3>화음</h3><p>한 턴에 같은 속성 기술을 2장 이상 쓰면 각자 위력 +(장수-1), 잔광 추가. 3장 이상이면 심지도 오른다. 세라핀의 무색 기술은 가장 큰 화음에 합류한다.</p>' +
        '<h3>잔광과 극의</h3><p>격돌 승리·화음·피격으로 잔광이 찬다. 100이 되면 손패에 극의(궁극기)가 나타난다.</p>' +
        '<h3>편성과 성장</h3><p>합류한 동료 중 전투마다 출전 인원을 고른다. 각인(이야기 진행으로 해금)을 하나 장착하고, 성흔 파편으로 무기를 단련할 수 있다.</p>' +
        '</div>';
      this.modal('조작법 · 전투 규칙', html);
    },

    openEndings: function () {
      var got = G.Save.endings(), d = D();
      var body = el('div');
      Object.keys(d.endings).forEach(function (k) {
        var e = d.endings[k], g = got[k];
        var row = el('div', 'slot' + (g ? '' : ' empty'));
        var th = el('div', 'thumb');
        if (g) G.Assets.fill(th, 'assets/cg/' + e.cg + '.png', e.label, (d.cgs[e.cg] || {}).color);
        else G.Assets.fill(th, '', '???', '#222');
        row.appendChild(th);
        row.appendChild(el('div', 'info', '<div class="t">' + e.label + (g ? ' · ' + U.esc(e.title) : ' · ???') + '</div>' +
          '<div class="s">' + (g ? new Date(g.at).toLocaleString() + ' · 기록한 이름 ' + (g.names || 0) + '개' : '아직 보지 못했다') + '</div>'));
        body.appendChild(row);
      });
      body.appendChild(el('p', 'hint', '엔딩은 세 가지. 진짜 결말에 닿으려면 플레이 중 얻는 단서(수첩)를 잘 살펴보자.'));
      this.modal('엔딩 기록', body);
    },

    chapterCard: function (r, cb) {
      var self = this, ov = $('#overlay');
      this.closeOverlay();
      var keyLabel = { prologue: 'PROLOGUE', ch1: 'CHAPTER 1', ch2: 'CHAPTER 2', ch3: 'CHAPTER 3', ch4: 'CHAPTER 4', ch5: 'CHAPTER 5', epilogue: 'EPILOGUE' }[r.key] || r.key.toUpperCase();
      var card = el('div', 'chapter-card', '<div class="k">' + keyLabel + '</div><h2>' + U.esc(r.title) + '</h2><div class="sub">' + U.esc(r.sub) + '</div><div class="go">클릭하여 계속</div>');
      ov.appendChild(card);
      ov.classList.remove('hidden');
      var done = false, armed = false;
      // 이 표지를 띄운 클릭이 오버레이까지 버블링되어 곧바로 닫히지 않도록 잠시 뒤에 입력을 받는다
      setTimeout(function () { armed = true; }, 250);
      var go = function () { if (done || !armed) return; done = true; self.closeOverlay(); cb(); };
      ov.onclick = go;
      this._overlayKey = go;
      this._overlayClose = go;
      if (this.isSkipping()) this.later(go, 400);
    },

    tipModal: function (text, cb) {
      var self = this, ov = $('#overlay');
      this.closeOverlay();
      var box = el('div', 'tip-box', '<h3>도움말</h3><p>' + U.esc(text) + '</p>');
      var b = el('button', 'btn primary', '확인');
      var done = false, armed = false;
      setTimeout(function () { armed = true; }, 250);
      var go = function () { if (done || !armed) return; done = true; self.closeOverlay(); cb(); };
      b.onclick = go;
      box.appendChild(b);
      ov.appendChild(box);
      ov.classList.remove('hidden');
      this._overlayKey = go; this._overlayClose = go;
    },

    showEnding: function (id) {
      var self = this, d = D(), e = d.endings[id] || { title: id, label: 'END', cg: 'ending_' + id };
      var s = this.story.state;
      G.Save.addEnding(id, { at: Date.now(), names: s.names.length, playtime: s.playtime });
      this.autosave();
      this.closeOverlay();
      var wrap = el('div', 'ending');
      var cg = el('div', 'cg');
      G.Assets.fill(cg, 'assets/cg/' + e.cg + '.png', '[엔딩 CG] ' + e.title, (d.cgs[e.cg] || {}).color || '#333');
      wrap.appendChild(cg);
      wrap.appendChild(el('div', 'lab', e.label));
      wrap.appendChild(el('h2', '', U.esc(e.title)));
      var got = G.Save.endings();
      wrap.appendChild(el('div', 'stats', '플레이 시간 ' + U.fmtTime(s.playtime) + ' · 기록한 이름 ' + s.names.length + '개 · 선택 ' + s.choices.length + '회<br>' +
        '본 엔딩 ' + Object.keys(got).length + ' / ' + Object.keys(d.endings).length +
        (id !== 'true' ? '<br><span class="hint">수첩의 단서를 다시 읽어 보자. 결말은 하나가 아니다.</span>' : '')));
      var b = el('button', 'btn primary', '타이틀로');
      b.onclick = function () { wrap.remove(); self.renderTitle(); };
      wrap.appendChild(b);
      $('#app').appendChild(wrap);
      this.cur = null;
    },

    // 전투에서 돌아올 때
    returnFromBattle: function (won, summary) {
      var s = this.story.state, d = D();
      this.show('story');
      if (won) {
        var def = d.battles[summary.id];
        s.battles[summary.id] = { turns: summary.turns };
        s.shards += def.reward || 0;
        this.story.resume();
        this.autosave();
        if (def.reward) this.toast('승리 — 성흔 파편 +' + def.reward);
      }
      this.renderBg(); this.renderCg(); this.renderChars(); this.renderScene();
      this.step();
    }
  };
})(window);
