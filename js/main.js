/* 부팅 */
(function () {
  'use strict';
  function boot() {
    try { window.Game.App.init(); }
    catch (e) { console.error(e); document.body.innerHTML = '<pre style="color:#f88;padding:20px">초기화 오류: ' + e.message + '</pre>'; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
