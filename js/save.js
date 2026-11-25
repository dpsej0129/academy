/* 세이브: localStorage 자동저장 + 수동 슬롯 3개, 설정, 읽은 대사 기록, 엔딩 기록.
 * localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 메모리에만 저장한다. */
(function (root) {
  'use strict';
  var G = root.Game = root.Game || {};
  var PREFIX = 'ashfalcon.v1.';
  var mem = {};

  function lsGet(k) {
    try { var v = root.localStorage.getItem(PREFIX + k); return v === null ? (mem[k] || null) : v; }
    catch (e) { return mem[k] || null; }
  }
  function lsSet(k, v) {
    mem[k] = v;
    try { root.localStorage.setItem(PREFIX + k, v); return true; } catch (e) { return false; }
  }
  function lsDel(k) {
    delete mem[k];
    try { root.localStorage.removeItem(PREFIX + k); } catch (e) { /* 무시 */ }
  }
  function readJSON(k, def) {
    var v = lsGet(k);
    if (!v) return def;
    try { return JSON.parse(v); } catch (e) { return def; }
  }

  var DEFAULT_SETTINGS = {
    textSpeed: 45,      // 초당 글자 수 (100 = 즉시)
    autoDelay: 1.2,     // 오토: 줄 표시 후 대기 초 (+ 글자 수 비례)
    battleSpeed: 1,     // 전투 연출 배속 1 / 2 / 4 / 0(즉시)
    shake: true,
    skipUnread: false   // false = 읽은 대사만 스킵 (요구사항 기본값)
  };

  var Save = G.Save = {
    SLOTS: ['auto', '1', '2', '3'],

    write: function (slot, state, meta) {
      var data = { meta: meta || {}, state: state, savedAt: Date.now() };
      return lsSet('slot.' + slot, JSON.stringify(data));
    },
    read: function (slot) { return readJSON('slot.' + slot, null); },
    remove: function (slot) { lsDel('slot.' + slot); },
    list: function () {
      return Save.SLOTS.map(function (s) { return { slot: s, data: Save.read(s) }; });
    },
    latest: function () {
      var best = null;
      Save.list().forEach(function (e) { if (e.data && (!best || e.data.savedAt > best.data.savedAt)) best = e; });
      return best;
    },

    settings: function () {
      var s = readJSON('settings', {});
      var out = {};
      Object.keys(DEFAULT_SETTINGS).forEach(function (k) { out[k] = s[k] === undefined ? DEFAULT_SETTINGS[k] : s[k]; });
      return out;
    },
    saveSettings: function (s) { lsSet('settings', JSON.stringify(s)); },

    _read: null,
    readSet: function () {
      if (!Save._read) {
        Save._read = {};
        readJSON('read', []).forEach(function (id) { Save._read[id] = 1; });
      }
      return Save._read;
    },
    markRead: function (id) {
      var r = Save.readSet();
      if (r[id]) return;
      r[id] = 1;
      Save._dirty = true;
      if (!Save._timer) {
        Save._timer = setTimeout(Save.flushRead, 800);
      }
    },
    flushRead: function () {
      Save._timer = null;
      if (!Save._dirty) return;
      Save._dirty = false;
      lsSet('read', JSON.stringify(Object.keys(Save.readSet())));
    },
    isRead: function (id) { return !!Save.readSet()[id]; },

    endings: function () { return readJSON('endings', {}); },
    addEnding: function (id, info) {
      var e = Save.endings();
      e[id] = info || { at: Date.now() };
      lsSet('endings', JSON.stringify(e));
    },
    resetAll: function () {
      ['settings', 'read', 'endings'].concat(Save.SLOTS.map(function (s) { return 'slot.' + s; })).forEach(lsDel);
      Save._read = null;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
