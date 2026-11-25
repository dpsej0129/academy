/* docs/IMAGE_PROMPTS.md 생성기
 * 게임 데이터에서 실제로 참조하는 이미지 경로를 모두 모으고, 아래 묘사표로 프롬프트를 만든다.
 * 묘사가 빠진 경로가 있으면 실패한다 → 문서와 게임이 어긋나지 않는다.
 * 사용법: node tools/gen_image_prompts.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { load, ROOT } = require('./load');
const { Game, GameData: D } = load();

const STYLE = 'anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, ' +
  'muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration';
const NEG = 'lowres, blurry, jpeg artifacts, watermark, signature, text, letters, logo, extra fingers, deformed hands, bad anatomy, ' +
  '3d render, photorealistic, chibi, oversaturated neon colors, cropped head, duplicate character, modern city';

const SPEC = {
  char:     { res: '1080×1920', ratio: '9:16', use: '대화 스탠딩 (투명 배경 PNG)', frame: 'full body standing sprite, three-quarter view, centered, whole body visible from head to feet, plain transparent background, no background scenery' },
  portrait: { res: '512×512', ratio: '1:1', use: '전투 카드·편성 초상화', frame: 'bust portrait, head and shoulders, facing slightly left, simple dark vignette background' },
  cutin:    { res: '1920×640', ratio: '3:1', use: '극의(궁극기) 컷인 연출', frame: 'ultra wide dynamic action cut-in banner, dramatic diagonal composition, speed lines, character on the right third, glowing effects' },
  enemy:    { res: '768×768', ratio: '1:1', use: '전투 적 초상화', frame: 'creature or character portrait, centered, dark vignette background, menacing pose' },
  boss:     { res: '1024×1024', ratio: '1:1', use: '전투 보스 초상화', frame: 'boss portrait, imposing full presence, centered, dramatic rim light, dark vignette background' },
  bg:       { res: '1920×1080', ratio: '16:9', use: '배경', frame: 'background art, wide establishing shot, no characters, visual novel background, depth and atmosphere' },
  cg:       { res: '1920×1080', ratio: '16:9', use: '이벤트 CG', frame: 'cinematic event illustration, visual novel CG, emotional lighting' },
  ending:   { res: '1920×1080', ratio: '16:9', use: '엔딩 CG', frame: 'cinematic ending illustration, visual novel ending CG, emotional climax, painterly light' },
  title:    { res: '1920×1080', ratio: '16:9', use: '타이틀 화면 배경', frame: 'key visual, epic composition, leave the upper center empty for the title logo' },
  logo:     { res: '1600×600', ratio: '8:3', use: '타이틀 로고 (투명 배경 PNG)', frame: 'ornate title logo frame, transparent background' },
  icon:     { res: '128×128', ratio: '1:1', use: 'UI 아이콘 (투명 배경 PNG)', frame: 'flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px' }
};

// ------------------------------------------------------------------ 인물 묘사 (모든 표정에서 동일하게 유지)
const CHAR = {
  lennox: '17-year-old boy named Lennox, ash-silver messy hair, grey eyes, sharp jawline, faint dark circles, black and charcoal knight cadet uniform of Raven Hall with a worn silver falcon crest, long old longsword at the hip, small pen-nib shaped burn scar on the right palm',
  kaien: '18-year-old tall muscular boy named Kaien, short messy red hair, freckles across the nose, rolled-up sleeves, scuffed Raven Hall cadet uniform, large hand-forged round iron shield on the back, small bronze badge on the chest',
  vivienne: '17-year-old noble girl named Vivienne, long straight silver-blue hair with a frost-flower hairpin, pale blue eyes, elegant posture, white and navy Swan Hall mage uniform, short cape with a frost-flower ducal crest, slim silver crystal staff',
  roland: '18-year-old slender boy named Roland, wavy blond hair tied low at the nape, amber eyes, immaculate white Swan Hall uniform with a gold-trimmed short cape, a gold coin engraved with a white star between his fingers, dice charm on the belt',
  mireille: '15-year-old girl named Mireille, ash-silver hair in a neat side braid, soft grey eyes, white church healer apron over a pale grey Sanctum uniform, small silver staff with a tiny lantern charm',
  seraphine: '17-year-old girl named Seraphine, chocolate-brown bob haircut, warm brown eyes, plain worn scholarship-issue Raven Hall uniform, simple training sword, faint translucent empty rectangular window motif floating beside her',
  hester: 'ageless woman librarian named Hester, grey hair in a loose bun, grey knitted shawl, ink-stained fingertips, round spectacles, holding an old silver-thread bookmark',
  belgrave: 'elderly academy headmaster named Oswald Belgrave, long silver beard, deep brown and gold academic robes, carved wooden staff, kind grandfatherly face',
  julian: '19-year-old student council president named Julian, short dark wine-red hair, sharp red eyes, perfect posture, crimson-trimmed formal knight uniform with council sash, rapier in an ornate scabbard',
  magda: 'veteran female knight instructor in her forties named Magda, cropped brown hair, scar across the left cheek, muscular build, practical leather and steel training armor, wooden training sword over the shoulder',
  bruno: '17-year-old arrogant noble boy named Bruno, slicked-back dark green hair, Stag Hall uniform worn sloppily with an open collar, fancy rapier',
  finn: '16-year-old skinny timid boy named Finn, messy dull brown hair, freckles, oversized worn Raven Hall uniform, holding a small grey whetstone with both hands',
  ashen: 'the Ashen King, young man in his twenties with ash-grey hair, tired dark eyes, cracked compass-shaped crown made of ash, tattered grey royal coat over a modern grey hoodie, ash particles drifting around him',
  real_lennox: 'the true Lennox, same face as Lennox but colder and more fragile, hair slightly longer, standing on the other side of a mirror surface, faintly translucent edges, black mourning coat',
  martha: '21-year-old woman named Martha, red hair in a high ponytail, freckles, confident build, faded duel champion sash over a Raven Hall knight uniform',
  eleanor: 'elegant woman in her late thirties named Eleanor, long silver-blue hair like her daughter Vivienne, pale blue gown, frost-flower brooch, soft gentle eyes'
};
const EXPR = {
  normal: 'neutral calm expression', smile: 'gentle warm smile', angry: 'angry frown, gritted teeth', sad: 'sad downcast eyes, holding back tears',
  surprised: 'surprised wide eyes, slightly open mouth', blank: 'empty glassy eyes with faint white glyph reflections, emotionless puppet-like face',
  cold: 'polite smile but cold empty eyes, unsettling', scared: 'frightened expression, shrinking posture'
};
const EXPR_KO = { normal: '기본', smile: '미소', angry: '분노', sad: '슬픔', surprised: '놀람', blank: '무표정(퀘스트 상태)', cold: '냉정', scared: '겁먹음' };
const ULT = {
  lennox: 'slashing diagonally with an ash-grey sword trail shaped like a falcon wing, purple moonlight shadows',
  kaien: 'slamming the iron shield down, forge-fire sparks and flames exploding, warm orange glow',
  vivienne: 'drawing a giant frost glyph in the air, ice crystals spreading into a blizzard, cold blue light',
  roland: 'throwing a gold coin and lightning dice, electric yellow arcs, jackpot sparkle',
  mireille: 'raising the silver staff in prayer, white dawn light pouring down like a cathedral, feathers of light',
  seraphine: 'slashing with a colorless blade leaving a white blank trail, floating empty UI window fragments shattering'
};

// ------------------------------------------------------------------ 적
const ENEMY = {
  ink_rat: 'a rat made of erased white paper, no fur texture, blank white eyes, eraser-smudged edges',
  name_hound: 'a huge white hound with a collar made of illegible erased letters, half its face smudged like eraser marks, white mist',
  training_doll: 'a wooden training dummy knight with a wooden sword, academy training yard dummy, worn paint',
  thug: 'upper-year noble student thug with a wooden club, smug face, Stag Hall uniform',
  bruno: 'Bruno, arrogant noble boy with slicked dark green hair, rapier drawn, sneering',
  ink_leech: 'a leech made of black ink crawling out of lake reeds, glossy, dripping',
  hollow_armor: 'an empty suit of knight armor walking by itself, white mist inside the helmet',
  lake_shade: 'a faceless figure wearing a Raven Hall school uniform, face erased like smudged pencil, white mist',
  warden: 'a giant academy examination automaton, white porcelain and steel, glowing white eye, judge-like design',
  warden_arm_l: 'the left arm of a giant examination automaton, sweeping blade arm, white porcelain and steel',
  warden_arm_r: 'the right arm of a giant examination automaton, heavy hammer fist, white porcelain and steel',
  cadet: 'knight course cadet in a red tournament tabard, wooden practice sword, determined face',
  twin_odel: 'twin swordsman Odel, dark purple short hair, dual swords, cold eyes, left-handed stance',
  twin_odil: 'twin swordswoman Odil, dark crimson short hair, dual swords, playful smirk, right-handed stance',
  festival_crawler: 'a shadow creature crawling between festival lanterns, white hollow eyes',
  hollow_student: 'a tall faceless erased figure in an old Raven Hall uniform with a faded duel champion sash, reaching hand',
  julian: 'Julian, student council president with dark wine-red hair, drawing a rapier, intense red eyes',
  margin_crawler: 'a pale white creature crawling out of blank nothingness, smooth featureless body, too many joints',
  margin_hound: 'a giant white guardian dog of the lighthouse, smooth chalk-like body, howling',
  imperial_agent: 'masked agent of a holy empire in a white cloak with a white star emblem, poison needle daggers',
  imperial_captain: 'imperial spymaster in an ornate white and gold cloak, white star emblem, longsword',
  roland_foe: 'Roland, blond boy in a white imperial cloak over his academy uniform, gold coin and rapier, sad smile',
  page_wraith: 'a wraith made of torn book pages folded into a human shape, paper blade arms',
  bookworm: 'a giant bookworm insect made of chewed letters and parchment, crawling out of shelves',
  choir_conductor: 'a faceless choir conductor in black robes with a white baton, surrounded by floating erased names',
  choir_soprano: 'a faceless choir singer in an old white academy uniform, mouth open in a high note, ghostly',
  choir_alto: 'a faceless choir singer in an old blue academy uniform, ghostly, hands clasped',
  choir_bass: 'a tall faceless choir singer in an old black academy uniform, ghostly, deep resonance',
  rewritten_student: 'academy student with white glowing glyphs flowing across the eyes, puppet-like stance',
  bruno_rewritten: 'Bruno with white glowing glyphs flowing across his eyes, crying, rapier raised stiffly',
  warden_mk2: 'an upgraded giant examination automaton painted white, twice as large, multiple blade arms, glowing lock seals',
  ink_squire: 'a squire knight made entirely of black ink, dripping, holding an ink blade',
  ledger_executor: 'a knight whose helmet is a giant pen nib, armor made of book pages and gold, executioner stance',
  belgrave: 'Headmaster Belgrave raising a staff that glows like a quill pen, white glyphs swirling, sorrowful smile',
  hollow_noble: 'an erased noble from a past era, white featureless face, ornate faded ducal clothing, old sword',
  ink_knight: 'a knight in pitch-black armor dripping black ink, a plastic keychain hanging from the belt, broken visor',
  scripted_seraphine: 'Seraphine with empty glowing white eyes, chains of white glyphs around her wrists, colorless sword',
  ashen_king: 'the Ashen King on his feet, cracked compass ash crown, grey coat over a hoodie, sword made of ash, tired expression',
  ledger: 'a gigantic floating open book the size of a cathedral, pages glowing gold, star constellations on the cover, ominous',
  ledger_quill: 'a gigantic floating golden quill pen with a razor nib, moving by itself',
  ledger_ink: 'a gigantic floating inkwell overflowing with black ink, starry reflections in the ink'
};

// ------------------------------------------------------------------ 배경
const BG = {
  room_earth: 'a cramped modern Seoul studio apartment at 3 AM, only a monitor glowing with a mobile RPG ending screen, energy drink cans, rain on the window',
  dorm_room: 'a small two-person dormitory room in an old fantasy academy, wooden rafters, cracked mirror on the wall, rough wool blankets, morning light through a window facing a lake',
  dorm_hall: 'the lounge of a modest academy dormitory for commoners, worn sofas, fireplace, notice board, raven motifs',
  dorm_night: 'the exterior of an old stone dormitory at night, raven weathervane, lanterns flickering, ominous white mist at the entrance',
  academy_gate: 'a long stone bridge crossing a mirror-like lake toward a gothic academy on an island, spring blossoms, banners',
  forest_day: 'a whispering ancient forest in daylight, leaves rustling without wind, sunbeams, mossy roots, training path',
  forest_rift: 'a forest clearing where the sky is torn open by a glowing white rift, papery white wind pouring out',
  training_yard: 'knight training yard of a fantasy academy, wooden dummies, weapon racks, sand ground, stone walls',
  classroom: 'a gothic magic lecture hall, chalkboard with glowing runes, tiered wooden desks, tall windows',
  library: 'an enormous grand library with towering shelves to a vaulted ceiling, ladders, dust in light beams',
  infirmary: 'a bright church infirmary ward, white linen beds, herb baskets, stained glass light',
  ballroom: 'a grand academy ballroom with hundreds of crystal chandeliers, gold trim, string quartet stage',
  ballroom_garden: 'a dark garden behind a ballroom at night, hedges, warm window light behind, stone path',
  ballroom_ruin: 'a grand ballroom in winter whose ceiling is being erased into white nothingness, broken chandeliers, falling snow and paper',
  lake_day: 'a calm mirror lake around an academy island, perfect reflections, reeds, walking path',
  lake_night: 'a mirror lake at night reflecting a starry sky, moonflowers on the shore, reeds, lantern light',
  arena: 'a circular red stone dueling arena with tiered seats, banners, sand floor, daytime',
  arena_final: 'a circular red dueling arena at night, ring of torches, packed crowd silhouettes, dramatic',
  arena_hall: 'a dim stone corridor lined with brass champion plaques, one plaque perfectly blank',
  tea_room: 'an elegant noble tea room in lilac and white, silver tea set, frost-flower decorations, afternoon light',
  clocktower: 'interior machine room of an old stopped clock tower, giant gears, dust, Korean hangul letters carved into the stone wall',
  clocktower_stairs: 'an endless spiral staircase inside a clock tower, walls covered with pasted book pages, white glow from above',
  clocktower_top: 'the top chamber of a clock tower at night, a giant open book on the floor glowing, broken clock face showing the sky',
  headmaster_office: 'a warm headmaster office with fireplace, bookshelves, antique desk, window to the lake, teacups',
  carriage: 'interior of a wooden travel carriage, cushioned benches, curtains, countryside sunlight',
  fortress: 'a white stone fortress at the edge of the world, beyond the walls only blank white nothingness without horizon',
  fortress_night: 'a white fortress wall at night, torches, beyond the wall a faintly glowing white void',
  lighthouse: 'top of a white lighthouse, giant lens facing inward toward the continent, an old wall map with arrows pointing inward',
  archive: 'a forbidden underground archive, chained books, descending endless stairs, candlelight, paper dust',
  archive_choir: 'a cathedral-like choir hall deep in an archive, choir stalls, faint ghostly silhouettes, dark',
  archive_deep: 'an abyss of gigantic overlapping book pages descending forever, golden handwriting glowing',
  corridor: 'a long gothic academy corridor in grey daylight, students standing in eerie rows, tall windows',
  courtyard_snow: 'an academy courtyard covered in first snow, frozen fountain, bare trees, quiet grey sky',
  dream_mirror: 'a dream room made entirely of mirrors reflecting infinitely, cold blue light, floating dust',
  margin_shore: 'an endless white void with a faint sense of shoreline, floating fragments of erased things: teacups, letters, buttons, a paper boat',
  memory_classroom: 'a faded classroom floating in white nothingness, everything bleached of color, chalk dust, window showing a white lake',
  ink_corridor: 'an endless corridor flooded with black ink, reflective floor, dripping pillars, faint gold glyphs',
  ashen_throne: 'a throne made of piled ash and broken crowns in a grey void, ash snow falling',
  ledger_heart: 'the heart of a cosmic book world, colossal glowing pages forming a sky, golden light, floating quill and inkwell',
  spring_academy: 'the academy on the lake island in full spring bloom, cherry-like blossoms, bright hopeful morning',
  white_void: 'a peaceful spring academy seen from afar with a soft white void visible on the far horizon, bittersweet'
};

// ------------------------------------------------------------------ CG
const CG = {
  cg_awaken: 'a boy with ash-silver hair (Lennox) staring in shock at his own reflection in a cracked mirror in a small dorm room, morning light, raising his scarred right palm',
  cg_carving: 'close-up of Korean hangul letters carved with a blade into an old stone wall inside a clock tower, lantern light, a hand touching the carving',
  cg_empty_bed: 'an empty dusty dormitory room with a single bare bed, a grey whetstone left on the desk, cold light',
  cg_reveal: 'Lennox standing before gigantic glowing book pages full of golden handwriting, a translucent grey king with a cracked compass crown appearing between the pages',
  cg_hester: 'an elderly librarian in a grey shawl fading into white powder from her feet up, smiling calmly, a headmaster watching, ink-stained hand reaching out',
  cg_winter_ball: 'a boy with ash-silver hair dancing with a partner in a grand winter ballroom, chandeliers, snow outside tall windows, warm gold light',
  cg_kaien_last: 'a big red-haired young man sitting against a dormitory door at dawn, eyes closed peacefully, broken sword in hand, a copper badge fallen on the snow',
  cg_ashen_name: 'the Ashen King removing his cracked crown in tears while sitting on an ash throne, a boy with ash-silver hair holding an open notebook',
  ending_true: 'spring morning at the academy, friends gathered on the lake shore, two paper boats floating toward a white door of light, a notebook full of names, hopeful',
  ending_normal: 'a young swordsman teaching unblessed children swordsmanship in a sunlit training yard, a soft white void on the distant horizon, bittersweet hope',
  ending_bad: 'an ash throne in a grey void, a silver-haired boy wearing a cracked compass crown looking down tiredly through a rift at new students, ominous'
};

const ELEM_ICON = {
  ember: 'a stylized red flame', tide: 'a stylized blue water drop with an ice crystal', thunder: 'a stylized yellow lightning bolt',
  verdant: 'a stylized green leaf with a vine', umbra: 'a stylized purple crescent moon with shadow', lumen: 'a stylized white-gold radiant star',
  blank: 'an empty grey square outline with a tiny spark, representing a blank slot'
};
const STATUS_ICON = {
  bleed: 'a red blood drop with a slash', burn: 'an orange flame on a small ember', paralyze: 'a yellow zigzag spark over a hand',
  bind: 'blue ice chains', haste: 'a green winged boot', shield: 'a silver round shield', focus: 'a golden eye with a target ring',
  erosion: 'a purple ink stain eating a letter', taunt: 'an orange shouting face with exclamation lines',
  broken: 'a white cracked sword stance icon', panic: 'a purple spiral over a cracked mind'
};

// ------------------------------------------------------------------ 참조 경로 수집
const used = new Set();
const script = new Game.Script(D);
script.ops.forEach((op) => { if (op.t === 'cmd' && op.cmd === 'show') used.add(op.args.split(/\s+/)[0].split(':')[0]); });
const entries = [];
function add(group, file, kind, title, subject, extra) {
  const spec = SPEC[kind];
  if (!subject) throw new Error('묘사 없음: ' + file);
  const prompt = [STYLE, spec.frame, subject, extra].filter(Boolean).join(', ');
  entries.push({ group, file, kind, title, spec, prompt });
}
// 스탠딩
Object.keys(D.characters).concat(Object.keys(D.npcs)).forEach((id) => {
  const c = D.characters[id] || D.npcs[id];
  if (!D.characters[id] && !used.has(id)) return;
  c.expressions.forEach((ex) => add('1. 캐릭터 스탠딩', `assets/char/${id}_${ex}.png`, 'char', `${c.fullName || c.name} — ${EXPR_KO[ex] || ex}`, CHAR[id], EXPR[ex]));
});
Object.keys(D.characters).forEach((id) => add('2. 전투 초상화', `assets/portrait/${id}.png`, 'portrait', D.characters[id].fullName, CHAR[id], 'determined expression'));
Object.keys(D.characters).forEach((id) => add('3. 극의 컷인', `assets/cutin/${id}_ult.png`, 'cutin', `${D.characters[id].fullName} — 「${D.skills[D.characters[id].ult].name}」`, CHAR[id], ULT[id]));
Object.keys(D.enemies).forEach((id) => {
  const e = D.enemies[id];
  const kind = e.tier === 'boss' ? 'boss' : 'enemy';
  add('4. 적 · 보스', `assets/enemy/${e.img || id}.png`, kind, `${e.name} (${{ mob: '일반', elite: '정예', boss: '보스', part: '부위' }[e.tier]})`, ENEMY[id]);
});
Object.keys(D.backgrounds).forEach((id) => { if (id === 'black') return; add('5. 배경', `assets/bg/${id}.png`, 'bg', D.backgrounds[id].name, BG[id]); });
Object.keys(D.cgs).forEach((id) => add(id.startsWith('ending') ? '7. 엔딩 CG' : '6. 이벤트 CG', `assets/cg/${id}.png`, id.startsWith('ending') ? 'ending' : 'cg', D.cgs[id].name, CG[id]));
add('8. 타이틀', 'assets/title/title_bg.png', 'title', '타이틀 배경', 'a boy with ash-silver hair and an old longsword standing on the roof of an old clock tower at night, a gigantic open glowing star ledger book in the sky above a gothic academy on a lake island, a grey falcon silhouette crossing the moon');
add('8. 타이틀', 'assets/title/logo.png', 'logo', '타이틀 로고 프레임', 'ornate antique gold frame with a falcon wing on the left and an open book with stars on the right, empty center plate for adding the Korean title text 「잿빛 매와 별의 장부」 later in an image editor');
Object.keys(D.elements).forEach((k) => add('9. UI 아이콘 — 속성', D.elements[k].icon, 'icon', `속성: ${D.elements[k].name}`, ELEM_ICON[k], `accent color ${D.elements[k].color}`));
Object.keys(D.statuses).forEach((k) => add('10. UI 아이콘 — 상태이상', D.statuses[k].icon, 'icon', `상태: ${D.statuses[k].name}`, STATUS_ICON[k]));

// ------------------------------------------------------------------ 문서 출력
let md = `# IMAGE PROMPTS — 「잿빛 매와 별의 장부」

> 이 문서는 \`node tools/gen_image_prompts.js\`로 생성된다. 게임 데이터가 실제로 참조하는 이미지 경로를 전부 모아 만들기 때문에, 여기 적힌 **파일 경로 그대로** 저장하면 게임에 바로 반영된다.
> 이미지를 넣은 뒤에는 \`node tools/scan_assets.js\`를 실행해 이미지 매니페스트(\`data/assets.js\`)를 갱신한다. (Node가 없다면 \`data/assets.js\`의 \`files\` 배열에 경로를 직접 추가하거나 \`probeAll: true\`로 바꾼다.)
> 파일이 없으면 게임은 색 블록 + 이름 텍스트로 대신 표시한다.

## 공통 스타일 (모든 프롬프트 맨 앞에 포함됨)

\`\`\`
${STYLE}
\`\`\`

## 공통 네거티브 프롬프트

\`\`\`
${NEG}
\`\`\`

## 제작 가이드

- **일관성**: 같은 인물은 아래 '인물 묘사'를 토씨 하나 바꾸지 말고 재사용한다. 가능하면 같은 시드 / 캐릭터 레퍼런스(IP-Adapter, 캐릭터 LoRA 등)를 쓴다.
- **스탠딩**은 투명 배경 PNG, 발끝까지 보이게. 게임은 화면 높이의 약 82%(모바일 62%)로 아래 정렬해 표시한다.
- **아이콘**은 16~24px로 축소되어 보이므로 실루엣이 분명해야 한다.
- 한글·영문 글자가 그림에 들어가지 않도록 한다(로고는 프레임만 만들고 글자는 편집 프로그램에서 넣는다). 단, 시계탑 낙서 CG는 글자 위치만 잡고 한글은 후보정으로 넣는 것을 권장한다.

| 구분 | 권장 해상도 | 비율 | 개수 |
|---|---|---|---|
`;
const groups = [...new Set(entries.map((e) => e.group))];
groups.forEach((g) => {
  const list = entries.filter((e) => e.group === g);
  md += `| ${g} | ${list[0].spec.res} | ${list[0].spec.ratio} | ${list.length} |\n`;
});
md += `| **합계** | | | **${entries.length}** |\n\n`;
md += `## 인물 묘사 (고정 문구)\n\n| ID | 묘사 |\n|---|---|\n`;
Object.keys(CHAR).forEach((id) => { if (D.characters[id] || used.has(id)) md += `| \`${id}\` | ${CHAR[id]} |\n`; });
md += '\n';
groups.forEach((g) => {
  md += `\n## ${g}\n`;
  entries.filter((e) => e.group === g).forEach((e) => {
    md += `\n### \`${e.file}\`\n- **용도**: ${e.spec.use} — ${e.title}\n- **권장 해상도 / 비율**: ${e.spec.res} / ${e.spec.ratio}\n- **프롬프트**:\n\`\`\`\n${e.prompt}\n\`\`\`\n- **네거티브**: 공통 네거티브${e.kind === 'char' ? ' + `background scenery, multiple characters, cut off feet`' : e.kind === 'icon' ? ' + `background, gradient background, realistic shading`' : e.kind === 'bg' ? ' + `people, characters, crowd in foreground`' : ''}\n`;
  });
});
fs.writeFileSync(path.join(ROOT, 'docs/IMAGE_PROMPTS.md'), md);
console.log(`docs/IMAGE_PROMPTS.md: ${entries.length}개 항목`);
groups.forEach((g) => console.log('  ' + g + ': ' + entries.filter((e) => e.group === g).length));
