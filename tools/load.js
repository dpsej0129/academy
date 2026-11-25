/* Node에서 게임 스크립트를 브라우저와 같은 순서로 불러온다. (테스트·검증 도구용) */
'use strict';
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function scriptOrder() {
  // index.html의 <script src> 순서를 그대로 따른다.
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const out = [];
  const re = /<script\s+src="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function load(opts) {
  opts = opts || {};
  const files = (opts.files || scriptOrder()).filter((f) => opts.includeUi || !/js\/(ui|main|save)\.js$/.test(f));
  for (const f of files) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    vm.runInThisContext(code, { filename: f });
  }
  return { Game: globalThis.Game, GameData: globalThis.GameData };
}

module.exports = { load, ROOT, scriptOrder };
