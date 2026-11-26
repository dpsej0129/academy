/* 공용 코어: 난수, 유틸, 이벤트, 에셋 대체 표시
 * 브라우저(file://)와 Node 양쪽에서 동작하도록 전역 객체에 붙인다. */
(function (root) {
  'use strict';
  var G = root.Game = root.Game || {};

  // ---------- 난수 (시드 고정 가능) ----------
  function RNG(seed) {
    this.seed = (seed === undefined ? (Date.now() ^ (Math.random() * 1e9)) : seed) >>> 0;
    this.state = this.seed || 1;
  }
  RNG.prototype.next = function () { // mulberry32
    var t = (this.state = (this.state + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  RNG.prototype.int = function (a, b) { return a + Math.floor(this.next() * (b - a + 1)); };
  RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  RNG.prototype.weighted = function (items, weights) {
    var total = 0, i;
    for (i = 0; i < weights.length; i++) total += Math.max(0, weights[i]);
    if (total <= 0) return items[0];
    var r = this.next() * total;
    for (i = 0; i < items.length; i++) { r -= Math.max(0, weights[i]); if (r < 0) return items[i]; }
    return items[items.length - 1];
  };
  RNG.prototype.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(this.next() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };
  G.RNG = RNG;

  // ---------- 유틸 ----------
  G.util = {
    clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
    clone: function (o) { return JSON.parse(JSON.stringify(o)); },
    esc: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    fmtTime: function (sec) {
      sec = Math.floor(sec || 0);
      var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
      return (h ? h + ':' : '') + (h && m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
  };

  // ---------- 이벤트 버스 ----------
  G.bus = {
    _h: {},
    on: function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
    emit: function (ev, data) { (this._h[ev] || []).forEach(function (fn) { fn(data); }); }
  };

  // ---------- 에셋: 파일이 없으면 색 블록 + 이름 텍스트 ----------
  var cache = {}; // path -> 'ok' | 'fail' | Promise
  var imgs = {};  // path -> 불러온 Image (표정 시트 자르기용)
  G.Assets = {
    /** 매니페스트(data/assets.js)에 등록된 파일만 불러온다. 없는 파일을 요청하면 브라우저 콘솔에 404 에러가 찍히기 때문. */
    listed: function (path) {
      var m = root.GameData && root.GameData.assets;
      if (!m) return false;
      if (m.probeAll) return true;
      if (!m._set) { m._set = {}; (m.files || []).forEach(function (f) { m._set[f] = 1; }); }
      return !!m._set[path];
    },
    probe: function (path, cb) {
      if (!path || typeof Image === 'undefined' || !G.Assets.listed(path)) { cb(false); return; }
      if (cache[path] === 'ok') { cb(true); return; }
      if (cache[path] === 'fail') { cb(false); return; }
      if (cache[path] && cache[path].push) { cache[path].push(cb); return; }
      cache[path] = [cb];
      var img = new Image();
      imgs[path] = img;
      img.onload = function () { var l = cache[path]; cache[path] = 'ok'; l.forEach(function (f) { f(true); }); };
      img.onerror = function () { var l = cache[path]; cache[path] = 'fail'; l.forEach(function (f) { f(false); }); };
      img.src = path;
    },
    /** 엘리먼트에 이미지(있으면) 또는 대체 블록을 채운다. */
    fill: function (el, path, label, color, opts) {
      opts = opts || {};
      el.classList.add('asset');
      el.style.setProperty('--ph', color || '#556');
      el.setAttribute('data-src', path || '');
      var lab = el.querySelector('.asset-label');
      if (!lab) { lab = document.createElement('span'); lab.className = 'asset-label'; el.appendChild(lab); }
      lab.textContent = label || '';
      el.classList.add('placeholder');
      el.style.backgroundImage = '';
      var oldCv = el.querySelector('canvas.sheet-cv');
      if (oldCv) oldCv.remove();
      G.Assets.probe(path, function (ok) {
        if (el.getAttribute('data-src') !== (path || '')) return; // 그 사이 바뀜
        if (ok) {
          el.style.backgroundImage = 'url("' + path + '")';
          el.classList.remove('placeholder');
        }
      });
      return el;
    },
    /** 표정 시트 배치: 표정 수 → 열·행. 표정은 인물 데이터의 expressions 순서대로 왼쪽→오른쪽, 위→아래.
     *  1~3개: 한 줄 / 4개: 2×2 / 5~6개: 3×2 (5개면 마지막 칸은 비움) */
    sheetLayout: function (n) {
      var cols = n <= 3 ? n : (n === 4 ? 2 : 3);
      return { cols: cols, rows: Math.ceil(n / cols) };
    },
    sheetPath: function (id) { return 'assets/char/' + id + '_sheet.png'; },
    /** 인물 이미지 채우기. mode: 'full'(스탠딩) | 'bust'(전투·편성 초상화)
     *  우선순위: 개별 파일(char/<id>_<표정>.png 또는 portrait/<id>.png) → 표정 시트(char/<id>_sheet.png) → 대체 블록 */
    fillChar: function (el, id, expr, label, color, mode) {
      mode = mode || 'full';
      var single = mode === 'bust' ? 'assets/portrait/' + id + '.png' : 'assets/char/' + id + '_' + expr + '.png';
      if (G.Assets.listed(single)) return G.Assets.fill(el, single, label, color);
      var sheet = G.Assets.sheetPath(id);
      G.Assets.fill(el, '', label, color);
      var key = sheet + '#' + expr + '#' + mode;
      el.setAttribute('data-src', key);
      if (!G.Assets.listed(sheet)) return el;
      var D = root.GameData, c = (D.characters && D.characters[id]) || (D.npcs && D.npcs[id]);
      var list = (c && c.expressions) || ['normal'];
      var idx = Math.max(0, list.indexOf(expr));
      var layout = G.Assets.sheetLayout(list.length);
      G.Assets.probe(sheet, function (ok) {
        if (!ok || el.getAttribute('data-src') !== key) return;
        G.Assets.drawCell(el, imgs[sheet], layout, idx, mode);
      });
      return el;
    },
    /** 시트의 한 칸을 캔버스로 잘라 엘리먼트에 얹는다. (file://에서도 화면 표시는 가능) */
    /** 시트 크기·배치·칸 번호 → 잘라 낼 영역 {sx, sy, sw, sh}. 'bust'는 칸 위쪽의 머리~어깨 정사각형. */
    cellRect: function (w, h, layout, index, mode) {
      var cw = w / layout.cols, ch = h / layout.rows;
      var r = { sx: (index % layout.cols) * cw, sy: Math.floor(index / layout.cols) * ch, sw: cw, sh: ch };
      if (mode === 'bust') {
        var side = cw * 0.62;
        r.sx += (cw - side) / 2; r.sy += ch * 0.03; r.sw = side; r.sh = side;
      }
      return r;
    },
    drawCell: function (el, img, layout, index, mode) {
      var r = G.Assets.cellRect(img.naturalWidth, img.naturalHeight, layout, index, mode);
      var sx = r.sx, sy = r.sy, sw = r.sw, sh = r.sh;
      var cv = el.querySelector('canvas.sheet-cv');
      if (!cv) { cv = document.createElement('canvas'); el.appendChild(cv); }
      cv.className = 'sheet-cv ' + mode;
      cv.width = Math.max(1, Math.round(sw)); cv.height = Math.max(1, Math.round(sh));
      cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
      el.classList.remove('placeholder');
    },
    make: function (tag, cls, path, label, color) {
      var el = document.createElement(tag || 'div');
      if (cls) el.className = cls;
      return G.Assets.fill(el, path, label, color);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
