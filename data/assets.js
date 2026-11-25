/* 이미지 매니페스트 — tools/scan_assets.js가 자동 생성한다.
 * 여기에 적힌 파일만 불러온다(없는 파일을 요청해 콘솔 에러가 나는 것을 막기 위함).
 * 목록에 없는 이미지는 색 블록 + 이름 텍스트로 대신 표시된다.
 * probeAll: true로 바꾸면 목록과 상관없이 모든 경로를 시도한다(없는 파일은 콘솔에 404가 찍힘). */
(function (root) {
  'use strict';
  var D = root.GameData = root.GameData || {};
  D.assets = {
    probeAll: false,
    files: []
  };
})(typeof window !== 'undefined' ? window : globalThis);
