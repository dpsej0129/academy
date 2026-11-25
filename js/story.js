/* 스토리 엔진 — 시나리오 스크립트(DSL) 파서와 인터프리터. DOM에 의존하지 않는다.
 *
 * ── 시나리오 문법 (data/scenario/*.js) ─────────────────────────────
 *   *라벨                       점프 대상
 *   이름: 대사                  대사 (이름 16자 이내)
 *   레녹스: (속마음)            괄호로 감싼 대사는 독백 스타일
 *   그냥 문장                   나레이션
 *   // 주석
 *   if(조건) <아무 줄>           조건이 참일 때만 실행/표시
 *   ? 선택지 => 라벨 | 효과; 효과 | if 조건     ('? ' 물음표+공백으로 시작. 연속된 줄이 하나의 선택지 묶음, => 생략 시 다음 줄로)
 *
 *   @bg 배경ID                  @show 캐릭터[:표정] [L|C|R]       @hide 캐릭터|all
 *   @cg CG_ID | off             @scene 장소·시간 캡션             @sys 【상태창 문구】
 *   @chapter 키 | 제목 | 부제   @battle 전투ID                    @tip 튜토리얼 문구
 *   @set 효과; 효과             @if 조건 => 라벨                 @jump 라벨
 *   @party join|leave|die|away|return 캐릭터
 *   @unlock 캐릭터|all 단계     @name 지워진 이름                 @clue 단서
 *   @resolve 캐릭터 증감        @shards 수                        @fx shake|flash|glitch|white|fadeout
 *   @cutin 캐릭터               @wait ms                          @ending true|normal|bad
 *
 *   효과: aff.kaien+=2 / flag.mocked=1 / count-=1
 *   조건: JS식 비교. 변수 + 가상 변수(names, alive.X, member.X, dead.X, away.X, difficulty)
 */
(function (root) {
  'use strict';
  var G = root.Game = root.Game || {};

  // ------------------------------------------------------------ 파서
  var NAME_RE = /^([^:\s][^:]{0,15}):\s?(.*)$/;

  function parseEffects(str) {
    if (!str) return [];
    return str.split(';').map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
      var m = s.match(/^([\w.]+)\s*(\+=|-=|=)\s*(.+)$/);
      if (!m) throw new Error('효과 문법 오류: ' + s);
      var v = m[3].trim();
      var num = Number(v);
      return { key: m[1], op: m[2], val: isNaN(num) ? v.replace(/^['"]|['"]$/g, '') : num };
    });
  }

  function parseChoice(line, where) {
    // ? 텍스트 => 라벨 | 효과 | if 조건
    var body = line.replace(/^\?\s*/, '');
    var text = body, rest = '';
    var arrow = body.indexOf('=>');
    var segs;
    if (arrow >= 0) { text = body.slice(0, arrow); rest = body.slice(arrow + 2); }
    else {
      var bar = body.indexOf('|');
      if (bar >= 0) { text = body.slice(0, bar); rest = ' ' + body.slice(bar); }
    }
    segs = rest.split('|').map(function (s) { return s.trim(); });
    var opt = { text: text.trim(), target: null, effects: [], cond: null, where: where };
    if (arrow >= 0) opt.target = segs.shift() || null;
    else segs.shift();
    segs.forEach(function (sg) {
      if (!sg) return;
      if (/^if\s+/.test(sg)) opt.cond = sg.replace(/^if\s+/, '');
      else opt.effects = opt.effects.concat(parseEffects(sg));
    });
    return opt;
  }

  function parseScript(key, src) {
    var ops = [];
    var lines = String(src).split(/\r?\n/);
    var choice = null;
    ops.push({ t: 'label', name: '__start_' + key });
    function flush() { if (choice) { ops.push(choice); choice = null; } }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim().replace(/\\n/g, '\n');
      var where = key + ':' + (i + 1);
      if (!line || line.indexOf('//') === 0) { if (!line) flush(); continue; }
      var cond = null;
      var cm = line.match(/^if\(([^)]*(?:\([^)]*\)[^)]*)*)\)\s*(.*)$/);
      if (cm) { cond = cm[1]; line = cm[2]; }
      if (/^\?\s/.test(line)) { // '? 선택지' — '???: 대사'와 구분하기 위해 물음표 뒤 공백 필수
        var opt = parseChoice(line, where);
        if (cond) opt.cond = opt.cond ? '(' + opt.cond + ') && (' + cond + ')' : cond;
        if (!choice) choice = { t: 'choice', options: [], id: where, where: where };
        choice.options.push(opt);
        continue;
      }
      flush();
      if (line.charAt(0) === '*') { ops.push({ t: 'label', name: line.slice(1).trim(), where: where }); continue; }
      if (line.charAt(0) === '@') {
        var sp = line.indexOf(' ');
        var cmd = sp < 0 ? line.slice(1) : line.slice(1, sp);
        var args = sp < 0 ? '' : line.slice(sp + 1).trim();
        if (cmd === 'sys') { ops.push({ t: 'text', name: '', text: args, style: 'sys', id: where, cond: cond, where: where }); continue; }
        ops.push({ t: 'cmd', cmd: cmd, args: args, cond: cond, where: where });
        continue;
      }
      var nm = line.match(NAME_RE);
      var op = { t: 'text', name: '', text: line, id: where, cond: cond, where: where, style: 'narr' };
      if (nm && nm[2]) { op.name = nm[1].trim(); op.text = nm[2]; op.style = 'say'; }
      if (/^\(.*\)$/.test(op.text)) op.style = op.name ? 'mono' : 'narr-mono';
      ops.push(op);
    }
    flush();
    return ops;
  }

  function Script(data) {
    var self = this;
    this.ops = [];
    this.labels = {};
    var order = data.scenarioOrder || Object.keys(data.scenario || {});
    order.forEach(function (key) {
      if (!data.scenario[key]) return;
      var ops = parseScript(key, data.scenario[key]);
      ops.forEach(function (op) {
        if (op.t === 'label') {
          if (self.labels[op.name] !== undefined) throw new Error('라벨 중복: ' + op.name + ' (' + op.where + ')');
          self.labels[op.name] = self.ops.length;
        }
        self.ops.push(op);
      });
    });
  }
  G.parseScript = parseScript;
  G.Script = Script;

  // ------------------------------------------------------------ 상태
  var PARTY_IDS = ['lennox', 'kaien', 'vivienne', 'roland', 'mireille', 'seraphine'];

  function newState(difficulty) {
    var chars = {};
    PARTY_IDS.forEach(function (id) { chars[id] = { unlocked: 0, engraving: null, upgrade: 0, resolveBonus: 0 }; });
    return {
      version: 1, pos: 0, label: '__start_prologue', labelPos: 0,
      vars: {}, names: [], clues: [],
      party: { members: ['lennox'], dead: [], away: [] },
      chars: chars, shards: 0, difficulty: difficulty || 'normal',
      chapter: 'prologue', chapterTitle: '프롤로그', scene: '',
      bg: 'black', shown: {}, cg: null, playtime: 0, choices: [], battles: {}, ending: null
    };
  }
  G.newState = newState;

  // ------------------------------------------------------------ 인터프리터
  function Story(script, state, data) {
    this.script = script;
    this.state = state || newState();
    this.data = data || root.GameData;
    this.emit = function () {};
    this._fnCache = {};
  }
  G.Story = Story;

  Story.prototype.val = function (name) {
    var s = this.state;
    if (name === 'names') return s.names.length;
    if (name === 'difficulty') return s.difficulty;
    if (name === 'true') return true;
    if (name === 'false') return false;
    var m = name.match(/^(alive|member|dead|away)\.(\w+)$/);
    if (m) {
      var id = m[2], p = s.party;
      var mem = p.members.indexOf(id) >= 0, dead = p.dead.indexOf(id) >= 0, away = p.away.indexOf(id) >= 0;
      if (m[1] === 'member') return mem ? 1 : 0;
      if (m[1] === 'dead') return dead ? 1 : 0;
      if (m[1] === 'away') return away ? 1 : 0;
      return mem && !dead && !away ? 1 : 0;
    }
    var v = s.vars[name];
    return v === undefined ? 0 : v;
  };

  Story.prototype.test = function (expr) {
    if (!expr) return true;
    var fn = this._fnCache[expr];
    if (!fn) {
      var js = expr.replace(/("[^"]*"|'[^']*')|([A-Za-z_][\w.]*)/g, function (all, str, id) {
        if (str) return str;
        return 'V(' + JSON.stringify(id) + ')';
      });
      try { fn = new Function('V', 'return !!(' + js + ');'); }
      catch (e) { throw new Error('조건식 오류: ' + expr); }
      this._fnCache[expr] = fn;
    }
    var self = this;
    return fn(function (n) { return self.val(n); });
  };

  Story.prototype.applyEffects = function (effects) {
    var s = this.state;
    effects.forEach(function (ef) {
      var cur = s.vars[ef.key] || 0;
      if (ef.op === '+=') s.vars[ef.key] = cur + Number(ef.val);
      else if (ef.op === '-=') s.vars[ef.key] = cur - Number(ef.val);
      else s.vars[ef.key] = ef.val;
    });
  };

  Story.prototype.jump = function (label, where) {
    var idx = this.script.labels[label];
    if (idx === undefined) throw new Error('없는 라벨: ' + label + ' (' + (where || '') + ')');
    this.state.pos = idx;
  };

  /** 다음으로 '표시해야 할 것'이 나올 때까지 진행한다. */
  Story.prototype.run = function () {
    var s = this.state, ops = this.script.ops, guard = 0;
    while (guard++ < 20000) {
      if (s.pos >= ops.length) return { type: 'end' };
      var op = ops[s.pos];
      if (op.cond && !this.test(op.cond)) { s.pos++; continue; }
      if (op.t === 'label') { s.label = op.name; s.labelPos = s.pos; s.pos++; continue; }
      if (op.t === 'text') return { type: 'text', op: op };
      if (op.t === 'choice') {
        var self = this;
        var opts = op.options.filter(function (o) { return !o.cond || self.test(o.cond); });
        if (!opts.length) { s.pos++; continue; }
        return { type: 'choice', op: op, options: opts };
      }
      var r = this.exec(op);
      if (r) return r;
    }
    throw new Error('스크립트 무한 루프 의심 (pos ' + s.pos + ')');
  };

  /** 텍스트/블로킹 명령을 넘긴다. */
  Story.prototype.advance = function () { this.state.pos++; };

  Story.prototype.choose = function (opt) {
    var s = this.state;
    this.applyEffects(opt.effects);
    s.choices.push(opt.where + ':' + opt.text);
    if (opt.target) this.jump(opt.target, opt.where);
    else s.pos++;
  };

  Story.prototype.exec = function (op) {
    var s = this.state, a = op.args, D = this.data, self = this;
    var parts = a.split(/\s+/);
    switch (op.cmd) {
      case 'bg': s.bg = parts[0]; s.cg = null; this.emit('bg', s.bg); break;
      case 'show': {
        var idx = parts[0].split(':');
        var prev = s.shown[idx[0]];
        s.shown[idx[0]] = { expr: idx[1] || (prev ? prev.expr : 'normal'), pos: parts[1] || (prev ? prev.pos : 'C') };
        this.emit('chars'); break;
      }
      case 'hide':
        if (parts[0] === 'all') s.shown = {}; else delete s.shown[parts[0]];
        this.emit('chars'); break;
      case 'cg': s.cg = parts[0] === 'off' ? null : parts[0]; this.emit('cg', s.cg); break;
      case 'scene': s.scene = a; this.emit('scene', a); break;
      case 'fx': this.emit('fx', parts[0]); break;
      case 'set': this.applyEffects(parseEffects(a)); break;
      case 'jump': this.jump(a, op.where); return null;
      case 'if': {
        var m = a.split('=>');
        if (this.test(m[0].trim())) { this.jump(m[1].trim(), op.where); return null; }
        break;
      }
      case 'party': {
        var act = parts[0], id = parts[1], p = s.party;
        var rm = function (arr) { var i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); };
        if (act === 'join') { if (p.members.indexOf(id) < 0) p.members.push(id); rm(p.away); }
        else if (act === 'leave') rm(p.members);
        else if (act === 'away') { if (p.away.indexOf(id) < 0) p.away.push(id); }
        else if (act === 'return') rm(p.away);
        else if (act === 'die') { rm(p.members); if (p.dead.indexOf(id) < 0) p.dead.push(id); }
        this.emit('party', { act: act, id: id });
        break;
      }
      case 'unlock': {
        var tier = +parts[1] || 1;
        var ids = parts[0] === 'all' ? Object.keys(s.chars) : [parts[0]];
        ids.forEach(function (id) { if (s.chars[id]) s.chars[id].unlocked = Math.max(s.chars[id].unlocked, tier); });
        this.emit('toast', '각인 해금 — ' + (parts[0] === 'all' ? '전원' : (D.characters[parts[0]] || {}).name) + ' ' + tier + '단계');
        break;
      }
      case 'name':
        if (s.names.indexOf(a) < 0) s.names.push(a);
        this.emit('toast', '수첩에 이름을 적었다 — 「' + a + '」');
        break;
      case 'clue':
        if (s.clues.indexOf(a) < 0) s.clues.push(a);
        this.emit('toast', '수첩에 단서가 적혔다');
        break;
      case 'resolve': {
        var c = s.chars[parts[0]];
        if (c) {
          c.resolveBonus = Math.max(-20, Math.min(20, c.resolveBonus + Number(parts[1])));
          var nm = (D.characters[parts[0]] || {}).name || parts[0];
          this.emit('toast', nm + '의 심지 ' + (Number(parts[1]) > 0 ? '+' : '') + parts[1]);
        }
        break;
      }
      case 'shards':
        s.shards += Number(parts[0]);
        this.emit('toast', '성흔 파편 +' + parts[0]);
        break;
      case 'save': this.emit('autosave'); break;
      case 'chapter': {
        var cp = a.split('|').map(function (x) { return x.trim(); });
        s.chapter = cp[0]; s.chapterTitle = cp[1] || ''; s.scene = '';
        return { type: 'chapter', key: cp[0], title: cp[1] || '', sub: cp[2] || '' };
      }
      case 'battle': return { type: 'battle', id: parts[0] };
      case 'tip': return { type: 'tip', text: a };
      case 'wait': return { type: 'wait', ms: Number(parts[0]) || 500 };
      case 'cutin': return { type: 'cutin', id: parts[0] };
      case 'ending': s.ending = parts[0]; return { type: 'ending', id: parts[0] };
      default:
        throw new Error('알 수 없는 명령 @' + op.cmd + ' (' + op.where + ')');
    }
    s.pos++;
    return null;
  };

  /** 블로킹 명령(전투·장 표지 등)을 마친 뒤 호출 */
  Story.prototype.resume = function () { this.state.pos++; };

  /** 전투 편성 가능 인원 */
  Story.prototype.availableFor = function (battleId) {
    var def = this.data.battles[battleId], p = this.state.party;
    if (def.fixed) return def.fixed.slice();
    var pool = p.members.concat(def.guests || []);
    var out = [];
    pool.forEach(function (id) {
      if (out.indexOf(id) < 0 && p.dead.indexOf(id) < 0 && p.away.indexOf(id) < 0) out.push(id);
    });
    return out;
  };

  /** 전투에 넘길 파티 정보 (각인·단련·스토리 심지 보정 포함) */
  Story.prototype.partySpec = function (ids) {
    var s = this.state, self = this;
    return ids.map(function (id) {
      var c = s.chars[id] || {};
      var aff = Number(self.val('aff.' + id)) || 0;
      return {
        id: id, upgrade: c.upgrade || 0,
        engraving: c.engraving && c.unlocked >= (self.data.engravings[c.engraving] || {}).tier ? c.engraving : null,
        resolveBonus: Math.max(-20, Math.min(20, (c.resolveBonus || 0) + Math.max(-6, Math.min(6, aff))))
      };
    });
  };

  /** 세이브 위치를 라벨 기준으로 복원 (스크립트가 수정돼도 최대한 근처로) */
  Story.prototype.restore = function (state) {
    var labelIdx = this.script.labels[state.label];
    if (labelIdx !== undefined && typeof state.labelPos === 'number') {
      var off = state.pos - state.labelPos;
      state.pos = labelIdx + Math.max(0, off);
      state.labelPos = labelIdx;
    }
    if (state.pos >= this.script.ops.length) state.pos = Math.max(0, this.script.ops.length - 1);
    this.state = state;
  };
})(typeof window !== 'undefined' ? window : globalThis);
