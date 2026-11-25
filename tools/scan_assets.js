/* assets/ 폴더를 훑어 data/assets.js(이미지 매니페스트)를 다시 만든다.
 * 이미지를 추가한 뒤 실행: node tools/scan_assets.js
 * (Node가 없다면 data/assets.js의 files 배열에 경로를 직접 적거나 probeAll을 true로 바꾼다.) */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = dir + '/' + f;
    const st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) walk(rel);
    else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(f)) files.push(rel);
  }
})('assets');
files.sort();
const out = `/* 이미지 매니페스트 — tools/scan_assets.js가 자동 생성한다.
 * 여기에 적힌 파일만 불러온다(없는 파일을 요청해 콘솔 에러가 나는 것을 막기 위함).
 * 목록에 없는 이미지는 색 블록 + 이름 텍스트로 대신 표시된다.
 * probeAll: true로 바꾸면 목록과 상관없이 모든 경로를 시도한다(없는 파일은 콘솔에 404가 찍힘). */
(function (root) {
  'use strict';
  var D = root.GameData = root.GameData || {};
  D.assets = {
    probeAll: false,
    files: ${JSON.stringify(files, null, 2).replace(/\n/g, '\n    ')}
  };
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(ROOT, 'data/assets.js'), out);
console.log(`data/assets.js: ${files.length}개 이미지 등록`);
