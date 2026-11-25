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
  G.Assets = {
    probe: function (path, cb) {
      if (!path || typeof Image === 'undefined') { cb(false); return; }
      if (cache[path] === 'ok') { cb(true); return; }
      if (cache[path] === 'fail') { cb(false); return; }
      if (cache[path] && cache[path].push) { cache[path].push(cb); return; }
      cache[path] = [cb];
      var img = new Image();
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
      G.Assets.probe(path, function (ok) {
        if (el.getAttribute('data-src') !== (path || '')) return; // 그 사이 바뀜
        if (ok) {
          el.style.backgroundImage = 'url("' + path + '")';
          el.classList.remove('placeholder');
        }
      });
      return el;
    },
    make: function (tag, cls, path, label, color) {
      var el = document.createElement(tag || 'div');
      if (cls) el.className = cls;
      return G.Assets.fill(el, path, label, color);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
