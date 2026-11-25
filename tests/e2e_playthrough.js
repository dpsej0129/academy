/* 브라우저 통합 테스트: index.html을 file://로 열어 타이틀부터 엔딩까지 자동으로 진행한다.
 * 사용법: node tests/e2e_playthrough.js [strategy] [viewport]
 *   strategy: first | last | true (트루 엔딩 경로) | random:<seed>
 *   viewport: desktop | mobile
 * 콘솔 에러, 페이지 에러가 하나라도 있으면 실패한다. */
'use strict';
const path = require('path');
const { chromium, devices } = require('playwright');

const strategy = process.argv[2] || 'first';
const vp = process.argv[3] || 'desktop';
const shotDir = process.env.SHOTS || null;

// 트루 엔딩 경로: 선택지 문구에 포함된 키워드로 고른다
const TRUE_PICKS = [
  '시험 잘 보시죠', '다정하게', '진심으로 사과', '같은 편으로', '이름을 적는다', '모르는 척', '손을 댄다', '명패', '손을 내민다',
  '세라핀과 경계', '믿는다', '낱장', '손을 잡는다', '진실을 말한다', '비비안에게 손을', '롤랑에게', '누구의 이름도', '강이준', '다시 쓴다'
];

function rng(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), t | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

(async () => {
  const browser = await chromium.launch();
  const ctxOpts = vp === 'mobile' ? { ...devices['Pixel 5'] } : { viewport: { width: 1280, height: 800 } };
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('dialog', (d) => d.accept());
  const url = 'file://' + path.join(__dirname, '..', 'index.html');
  await page.goto(url);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('ashfalcon.v1.settings', JSON.stringify({ textSpeed: 100, autoDelay: 0.3, battleSpeed: 0, shake: false, skipUnread: false }));
  });
  await page.reload();
  await page.click('text=새로 시작');
  await page.click('#overlay button.btn.primary'); // 보통
  const rand = strategy.startsWith('random:') ? rng(+strategy.split(':')[1]) : null;
  const picked = [];
  let steps = 0, battles = 0, lastBattle = null, endingId = null;
  const t0 = Date.now();
  while (steps++ < 20000) {
    if (errors.length) break;
    const state = await page.evaluate(() => {
      const vis = (s) => { const e = document.querySelector(s); return e && !e.classList.contains('hidden'); };
      return {
        ending: !!document.querySelector('.ending'),
        endingTitle: (document.querySelector('.ending h2') || {}).textContent || '',
        overlay: vis('#overlay'),
        chapter: !!document.querySelector('#overlay .chapter-card'),
        tip: !!document.querySelector('#overlay .tip-box'),
        result: !!document.querySelector('#overlay .b-result'),
        resultWin: !!document.querySelector('#overlay .b-result.win'),
        formation: vis('#formation-screen'),
        battle: vis('#battle-screen'),
        auto: !!document.querySelector('#b-autobattle.primary'),
        choice: vis('#choice-layer'),
        choices: Array.from(document.querySelectorAll('#choice-layer .choice')).map((b) => b.textContent),
        title: vis('#title-screen'),
        bname: (document.querySelector('.b-head .title') || {}).textContent || ''
      };
    });
    if (state.ending) { endingId = state.endingTitle; break; }
    if (state.title) { errors.push('타이틀로 돌아옴 (엔딩 없이)'); break; }
    if (state.chapter) { await page.click('#overlay'); continue; }
    if (state.tip) { await page.click('#overlay .tip-box button'); continue; }
    if (state.result) {
      if (!state.resultWin) {
        // 패배: 쉬움으로 재도전(없으면 재도전)
        const easy = await page.$('#overlay button:has-text("쉬움으로")');
        if (easy) await easy.click(); else await page.click('#overlay button:has-text("재도전")');
        console.log('  패배 → 재도전:', lastBattle);
      } else await page.click('#overlay button:has-text("계속")');
      continue;
    }
    if (state.overlay) { await page.keyboard.press('Escape'); continue; }
    if (state.formation) {
      if (shotDir && battles === 0) await page.screenshot({ path: path.join(shotDir, `formation_${vp}.png`) });
      await page.click('.form-foot button.primary');
      battles++;
      continue;
    }
    if (state.battle) {
      lastBattle = state.bname;
      if (shotDir && battles === 2 && !state.auto) await page.screenshot({ path: path.join(shotDir, `battle_${vp}.png`) });
      if (!state.auto) await page.click('#b-autobattle');
      await page.waitForTimeout(60);
      continue;
    }
    if (state.choice) {
      let idx = 0;
      if (strategy === 'last') idx = state.choices.length - 1;
      else if (rand) idx = Math.floor(rand() * state.choices.length);
      else if (strategy === 'true') {
        idx = state.choices.findIndex((c) => TRUE_PICKS.some((k) => c.includes(k)));
        if (idx < 0) idx = 0;
      }
      picked.push(state.choices[idx].replace(/^\d/, ''));
      if (shotDir && picked.length === 1) await page.screenshot({ path: path.join(shotDir, `choice_${vp}.png`) });
      await page.click(`#choice-layer .choice >> nth=${idx}`);
      continue;
    }
    if (shotDir && steps === 40) await page.screenshot({ path: path.join(shotDir, `story_${vp}.png`) });
    await page.click('#dialog');
  }
  if (shotDir) await page.screenshot({ path: path.join(shotDir, `ending_${vp}.png`) });
  const summary = await page.evaluate(() => {
    const s = window.Game.App.story && window.Game.App.story.state;
    return s ? { names: s.names, party: s.party, choices: s.choices.length, flags: s.vars } : null;
  });
  console.log(`strategy=${strategy} vp=${vp} steps=${steps} battles=${battles} ending=${endingId} time=${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log('choices:', picked.length, '| names:', summary && summary.names.join(', '));
  if (summary) console.log('party:', JSON.stringify(summary.party));
  await browser.close();
  if (errors.length || !endingId) {
    console.error('FAIL', errors.slice(0, 10));
    process.exit(1);
  }
  console.log('PASS — 콘솔 에러 0');
})();
