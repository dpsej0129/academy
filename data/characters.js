/* 캐릭터·스킬·각인·속성·상태이상 데이터
 * 밸런스 수치는 여기서만 고치면 된다. (코드 수정 불필요)
 *
 * 스킬 필드
 *   base: 기본 위력 / lamps: 등불(코인) 수 / bonus: 점화(앞면) 시 위력 증감
 *   effects: [{ when:'use'|'hit'|'heads'|'win', do:'status'|'heal'|'resolve'|'glow', target, status, n, pct }]
 *     target: self | target | allies | enemies | lowestAlly | randomEnemy
 *   powerIf: { status, min, n } 대상이 상태이상을 min 이상 가지면 위력 +n
 *   perAlly: 살아있는 다른 아군 1명당 위력 +n
 */
(function (root) {
  'use strict';
  var D = root.GameData = root.GameData || {};

  D.elements = {
    ember:   { name: '홍염', color: '#e2583e', icon: 'assets/ui/elem_ember.png' },
    tide:    { name: '청류', color: '#3f8fe0', icon: 'assets/ui/elem_tide.png' },
    thunder: { name: '뇌명', color: '#e6c23a', icon: 'assets/ui/elem_thunder.png' },
    verdant: { name: '녹음', color: '#4fb562', icon: 'assets/ui/elem_verdant.png' },
    umbra:   { name: '월영', color: '#8d5ad8', icon: 'assets/ui/elem_umbra.png' },
    lumen:   { name: '백광', color: '#efe6c4', icon: 'assets/ui/elem_lumen.png' },
    blank:   { name: '무색', color: '#b9bec8', icon: 'assets/ui/elem_blank.png' }
  };

  D.statuses = {
    bleed:    { name: '출혈', icon: 'assets/ui/status_bleed.png',    color: '#c0392b', desc: '등불을 켤 때마다 수치만큼 피해. 턴 종료 시 절반.' },
    burn:     { name: '화상', icon: 'assets/ui/status_burn.png',     color: '#e67e22', desc: '턴 종료 시 수치만큼 피해 후 절반.' },
    paralyze: { name: '마비', icon: 'assets/ui/status_paralyze.png', color: '#f1c40f', desc: '다음 등불 n개가 반드시 불발.' },
    bind:     { name: '속박', icon: 'assets/ui/status_bind.png',     color: '#5dade2', desc: '다음 턴 속도 -n.' },
    haste:    { name: '신속', icon: 'assets/ui/status_haste.png',    color: '#58d68d', desc: '다음 턴 속도 +n.' },
    shield:   { name: '보호', icon: 'assets/ui/status_shield.png',   color: '#aab7b8', desc: '받는 피해 -n. 턴 종료 시 절반.' },
    focus:    { name: '집중', icon: 'assets/ui/status_focus.png',    color: '#f5b041', desc: '다음 턴 모든 위력 +n.' },
    erosion:  { name: '침식', icon: 'assets/ui/status_erosion.png',  color: '#7d3c98', desc: '턴 시작 시 심지 -n. 매 턴 1 감소.' },
    taunt:    { name: '도발', icon: 'assets/ui/status_taunt.png',    color: '#dc7633', desc: '다음 턴 적의 표적이 되기 쉽다.' },
    broken:   { name: '자세 붕괴', icon: 'assets/ui/status_broken.png', color: '#ffffff', desc: '행동 불가. 받는 피해 1.5배.' },
    panic:    { name: '공황', icon: 'assets/ui/status_panic.png',    color: '#9b59b6', desc: '무작위로 행동. 받는 피해 1.2배.' }
  };

  D.difficulty = {
    easy:   { label: '쉬움',   hp: 0.72, dmg: 0.7,  speed: 0, resolve: 10, desc: '이야기에 집중하고 싶은 분께.' },
    normal: { label: '보통',   hp: 1.0,  dmg: 1.0,  speed: 0, resolve: 0,  desc: '격돌과 화음을 익히면 무난합니다.' },
    hard:   { label: '어려움', hp: 1.3,  dmg: 1.25, speed: 1, resolve: -5, desc: '적이 더 빠르고 단단합니다.' }
  };

  // ---------------------------------------------------------------- 파티원 6명
  D.characters = {
    lennox: {
      name: '레녹스', fullName: '레녹스 그레이번', color: '#5e6478', element: 'umbra',
      hp: 92, speed: [4, 8], deck: ['len_s1', 'len_s2', 'len_s3'], ratio: [4, 3, 2],
      guard: 'len_guard', ult: 'len_ult', engravings: ['len_e1', 'len_e2', 'len_e3'],
      role: '속공 / 출혈', expressions: ['normal', 'smile', 'angry', 'sad', 'surprised'],
      bio: '몰락한 그레이번 검가의 마지막 아들. 그 안에는 다른 세계의 영혼이 있다.'
    },
    kaien: {
      name: '카이엔', fullName: '카이엔 브라트', color: '#b5502f', element: 'ember',
      hp: 140, speed: [2, 5], deck: ['kai_s1', 'kai_s2', 'kai_s3'], ratio: [4, 3, 2],
      guard: 'kai_guard', ult: 'kai_ult', engravings: ['kai_e1', 'kai_e2', 'kai_e3'],
      role: '방패 / 화상', expressions: ['normal', 'smile', 'angry', 'sad', 'surprised'],
      bio: '대장장이 집 아들. 시끄럽고, 배고프고, 의리 있다.'
    },
    vivienne: {
      name: '비비안', fullName: '비비안 로셰', color: '#3c6fa8', element: 'tide',
      hp: 80, speed: [3, 6], deck: ['viv_s1', 'viv_s2', 'viv_s3'], ratio: [3, 3, 2],
      guard: 'viv_guard', ult: 'viv_ult', engravings: ['viv_e1', 'viv_e2', 'viv_e3'],
      role: '각문술 / 속박', expressions: ['normal', 'smile', 'angry', 'sad', 'surprised'],
      bio: '로셰 공작가의 장녀. 마도과 수석. 얼음처럼 정확하다.'
    },
    roland: {
      name: '롤랑', fullName: '롤랑 드 베르니에', color: '#a08a2c', element: 'thunder',
      hp: 85, speed: [4, 7], deck: ['rol_s1', 'rol_s2', 'rol_s3'], ratio: [3, 3, 2],
      guard: 'rol_guard', ult: 'rol_ult', engravings: ['rol_e1', 'rol_e2', 'rol_e3'],
      role: '도박 / 마비', expressions: ['normal', 'smile', 'angry', 'sad', 'surprised'],
      bio: '웃는 얼굴의 정보상. 모든 것을 판돈으로 본다.'
    },
    mireille: {
      name: '미레유', fullName: '미레유 그레이번', color: '#c9b98a', element: 'lumen',
      hp: 85, speed: [2, 5], deck: ['mir_s1', 'mir_s2', 'mir_s3'], ratio: [3, 3, 2],
      guard: 'mir_guard', ult: 'mir_ult', engravings: ['mir_e1', 'mir_e2', 'mir_e3'],
      role: '치유 / 심지 회복', expressions: ['normal', 'smile', 'angry', 'sad', 'surprised'],
      bio: '레녹스의 여동생. 신성과의 어린 치유술사.'
    },
    seraphine: {
      name: '세라핀', fullName: '세라핀 루엘', color: '#9aa3ad', element: 'blank',
      hp: 95, speed: [3, 7], deck: ['ser_s1', 'ser_s2', 'ser_s3'], ratio: [4, 3, 2],
      guard: 'ser_guard', ult: 'ser_ult', engravings: ['ser_e1', 'ser_e2', 'ser_e3'],
      role: '무색 / 화음 연결', expressions: ['normal', 'smile', 'angry', 'sad', 'surprised', 'blank'],
      bio: '빈 성록창을 가진 장학생. 원작의 \'플레이어\'.'
    }
  };

  // ---------------------------------------------------------------- 비전투 인물 (스탠딩/대사용)
  D.npcs = {
    hester:   { name: '헤스터', fullName: '헤스터 크레인', color: '#6d6a5e', expressions: ['normal', 'smile', 'sad'] },
    belgrave: { name: '벨그레이브', fullName: '오스왈드 벨그레이브', color: '#8a7a5a', expressions: ['normal', 'smile', 'cold', 'sad'] },
    julian:   { name: '율리안', fullName: '율리안 하이든', color: '#7b2d3a', expressions: ['normal', 'angry', 'sad'] },
    magda:    { name: '마그다', fullName: '마그다 오르테가', color: '#7a5a3a', expressions: ['normal', 'angry', 'smile'] },
    bruno:    { name: '브루노', fullName: '브루노 카스텔', color: '#5a7a3a', expressions: ['normal', 'angry', 'scared'] },
    finn:     { name: '핀', fullName: '핀 애셔', color: '#7a8a6a', expressions: ['normal', 'smile', 'scared'] },
    ashen:    { name: '잿빛 왕', fullName: '잿빛 왕 (아르딘)', color: '#4a4a52', expressions: ['normal', 'smile', 'sad'] },
    real_lennox: { name: '레녹스?', fullName: '진짜 레녹스', color: '#3a3f55', expressions: ['normal', 'sad'] },
    doyun:    { name: '도윤', fullName: '한도윤', color: '#44506a', expressions: ['normal'] },
    ledger:   { name: '장부', fullName: '별의 장부', color: '#c8b46a', expressions: ['normal'] },
    martha:   { name: '마르타', fullName: '마르타 브라트', color: '#a0553a', expressions: ['normal', 'smile'] },
    eleanor:  { name: '엘레노어', fullName: '엘레노어 로셰', color: '#5a7fb0', expressions: ['normal', 'smile'] }
  };

  /** 대사 화자 이름 → 캐릭터 ID (스탠딩 강조용). 목록에 없으면 이름만 표시. */
  D.speakers = {
    '레녹스': 'lennox', '카이엔': 'kaien', '비비안': 'vivienne', '롤랑': 'roland', '미레유': 'mireille',
    '세라핀': 'seraphine', '세라': 'seraphine', '헤스터': 'hester', '학장': 'belgrave', '벨그레이브': 'belgrave',
    '율리안': 'julian', '마그다': 'magda', '마그다 교관': 'magda', '브루노': 'bruno', '핀': 'finn',
    '잿빛 왕': 'ashen', '아르딘': 'ashen', '이준': 'ashen', '레녹스?': 'real_lennox', '진짜 레녹스': 'real_lennox',
    '마르타': 'martha', '엘레노어': 'eleanor'
  };

  // ---------------------------------------------------------------- 스킬
  D.skills = {
    // 레녹스 — 월영, 속공·출혈
    len_s1: { name: '매의 첫 깃', element: 'umbra', base: 4, lamps: 2, bonus: 3, desc: '가볍고 빠른 사선 베기.' },
    len_s2: { name: '잿빛 활공', element: 'thunder', base: 4, lamps: 3, bonus: 2, desc: '적중 시 출혈 1.',
      effects: [{ when: 'hit', do: 'status', status: 'bleed', n: 1 }] },
    len_s3: { name: '역날 낙하', element: 'umbra', base: 6, lamps: 3, bonus: 3, desc: '대상 출혈 3 이상이면 위력 +2.',
      powerIf: { status: 'bleed', min: 3, n: 2 } },
    len_guard: { name: '흘려 받기', element: 'umbra', base: 4, lamps: 1, bonus: 4, type: 'guard', desc: '수비. 위력만큼 피해를 흡수.' },
    len_ult: { name: '잿빛 매 · 무명참', element: 'umbra', base: 9, lamps: 4, bonus: 4, ult: true,
      desc: '극의. 적중 시 출혈 2.', effects: [{ when: 'hit', do: 'status', status: 'bleed', n: 2 }] },

    // 카이엔 — 홍염, 탱커·화상
    kai_s1: { name: '정면 돌파', element: 'ember', base: 6, lamps: 1, bonus: 5, desc: '묵직한 한 방.' },
    kai_s2: { name: '방패 밀치기', element: 'verdant', base: 4, lamps: 2, bonus: 3, desc: '사용 시 자신 보호 3, 다음 턴 도발.',
      effects: [{ when: 'use', do: 'status', status: 'shield', n: 3, target: 'self' }, { when: 'use', do: 'status', status: 'taunt', n: 1, target: 'self' }] },
    kai_s3: { name: '풀무질 일격', element: 'ember', base: 6, lamps: 2, bonus: 5, desc: '적중 시 화상 2.',
      effects: [{ when: 'hit', do: 'status', status: 'burn', n: 2 }] },
    kai_guard: { name: '버티기', element: 'ember', base: 7, lamps: 1, bonus: 5, type: 'guard', desc: '수비. 다음 턴 도발.',
      effects: [{ when: 'use', do: 'status', status: 'taunt', n: 1, target: 'self' }] },
    kai_ult: { name: '대장간의 불씨', element: 'ember', base: 12, lamps: 2, bonus: 8, ult: true,
      desc: '극의. 사용 시 아군 전원 보호 4, 적중 시 화상 3.',
      effects: [{ when: 'use', do: 'status', status: 'shield', n: 4, target: 'allies' }, { when: 'hit', do: 'status', status: 'burn', n: 3 }] },

    // 비비안 — 청류, 각문술·속박
    viv_s1: { name: '서리 각문', element: 'tide', base: 3, lamps: 3, bonus: 2, desc: '적중 시 속박 1.',
      effects: [{ when: 'hit', do: 'status', status: 'bind', n: 1 }] },
    viv_s2: { name: '얼음 창', element: 'tide', base: 6, lamps: 2, bonus: 4, desc: '정확한 관통.' },
    viv_s3: { name: '빙결 서약', element: 'umbra', base: 4, lamps: 4, bonus: 3, desc: '점화 시 마비 1.',
      effects: [{ when: 'heads', do: 'status', status: 'paralyze', n: 1 }] },
    viv_guard: { name: '얼음 장벽', element: 'tide', base: 4, lamps: 2, bonus: 3, type: 'guard', desc: '수비.' },
    viv_ult: { name: '영구동토 정리', element: 'tide', base: 7, lamps: 5, bonus: 3, ult: true,
      desc: '극의. 적중 시 속박 2, 마비 1.',
      effects: [{ when: 'hit', do: 'status', status: 'bind', n: 2 }, { when: 'hit', do: 'status', status: 'paralyze', n: 1 }] },

    // 롤랑 — 뇌명, 고위험 고수익
    rol_s1: { name: '번개 주사위', element: 'thunder', base: 2, lamps: 3, bonus: 4, desc: '운에 맡긴다.' },
    rol_s2: { name: '속임수 찌르기', element: 'thunder', base: 4, lamps: 2, bonus: 3, desc: '적중 시 마비 1.',
      effects: [{ when: 'hit', do: 'status', status: 'paralyze', n: 1 }] },
    rol_s3: { name: '올인', element: 'ember', base: 1, lamps: 4, bonus: 5, desc: '격돌 승리 시 잔광 +15.',
      effects: [{ when: 'win', do: 'glow', n: 15, target: 'self' }] },
    rol_guard: { name: '눈속임', element: 'thunder', base: 3, lamps: 2, bonus: 3, type: 'guard', desc: '수비. 다음 턴 신속 2.',
      effects: [{ when: 'use', do: 'status', status: 'haste', n: 2, target: 'self' }] },
    rol_ult: { name: '잭팟', element: 'thunder', base: 5, lamps: 5, bonus: 5, ult: true,
      desc: '극의. 사용 시 자신 심지 +10.', effects: [{ when: 'use', do: 'resolve', n: 10, target: 'self' }] },

    // 미레유 — 백광, 치유
    mir_s1: { name: '정화의 지팡이', element: 'lumen', base: 4, lamps: 2, bonus: 2, desc: '적중 시 가장 다친 아군 체력 4 회복.',
      effects: [{ when: 'hit', do: 'heal', n: 4, target: 'lowestAlly' }] },
    mir_s2: { name: '성가 · 안식', element: 'lumen', base: 3, lamps: 2, bonus: 3, desc: '사용 시 아군 전원 심지 +3.',
      effects: [{ when: 'use', do: 'resolve', n: 3, target: 'allies' }] },
    mir_s3: { name: '심판의 종', element: 'tide', base: 6, lamps: 2, bonus: 4, desc: '맑은 종소리.' },
    mir_guard: { name: '기도의 방벽', element: 'lumen', base: 4, lamps: 1, bonus: 3, type: 'guard', desc: '수비. 가장 다친 아군 체력 6 회복.',
      effects: [{ when: 'use', do: 'heal', n: 6, target: 'lowestAlly' }] },
    mir_ult: { name: '백야의 기도', element: 'lumen', base: 6, lamps: 3, bonus: 3, ult: true,
      desc: '극의. 아군 전원 체력 20% 회복, 심지 +8.',
      effects: [{ when: 'use', do: 'heal', pct: 0.2, target: 'allies' }, { when: 'use', do: 'resolve', n: 8, target: 'allies' }] },

    // 세라핀 — 무색, 화음 와일드카드
    ser_s1: { name: '빈칸 베기', element: 'blank', base: 4, lamps: 2, bonus: 3, desc: '무색: 어떤 화음에도 합류.' },
    ser_s2: { name: '따라 쓰기', element: 'blank', base: 5, lamps: 2, bonus: 3, desc: '무색. 적중 시 자신 잔광 +5.',
      effects: [{ when: 'hit', do: 'glow', n: 5, target: 'self' }] },
    ser_s3: { name: '주인공 보정', element: 'blank', base: 4, lamps: 3, bonus: 3, perAlly: 1, desc: '살아있는 다른 아군 1명당 위력 +1.' },
    ser_guard: { name: '회피 프레임', element: 'blank', base: 4, lamps: 2, bonus: 2, type: 'guard', desc: '수비.' },
    ser_ult: { name: '퀘스트 완료', element: 'blank', base: 9, lamps: 4, bonus: 4, ult: true, desc: '극의. 사용 시 아군 전원 잔광 +10.',
      effects: [{ when: 'use', do: 'glow', n: 10, target: 'allies' }] }
  };

  // ---------------------------------------------------------------- 각인 (성장 요소)
  // 각 캐릭터 3종. 스토리 진행으로 해금(@unlock 1~3), 편성 화면에서 하나를 장착.
  D.engravings = {
    len_e1: { char: 'lennox', tier: 1, name: '매의 눈', desc: '속도 +1.', mods: { speed: 1 } },
    len_e2: { char: 'lennox', tier: 2, name: '깊은 상처', desc: '가하는 출혈 +1, 모든 위력 +1.', mods: { bleedPlus: 1, powerAll: 1 } },
    len_e3: { char: 'lennox', tier: 3, name: '역서의 흔적', desc: '격돌 승리 시 잔광 +10, 심지 +2.', mods: { glowOnWin: 10, resolveOnWin: 2 } },

    kai_e1: { char: 'kaien', tier: 1, name: '무쇠 심장', desc: '최대 체력 +20%.', mods: { hpPct: 0.2 } },
    kai_e2: { char: 'kaien', tier: 2, name: '풀무', desc: '가하는 화상 +2.', mods: { burnPlus: 2 } },
    kai_e3: { char: 'kaien', tier: 3, name: '형님 기질', desc: '수비 흡수 +4, 시작 심지 +5.', mods: { guardPlus: 4, startResolve: 5 } },

    viv_e1: { char: 'vivienne', tier: 1, name: '완벽주의', desc: '등불 점화 확률 +8%.', mods: { lampProb: 0.08 } },
    viv_e2: { char: 'vivienne', tier: 2, name: '겨울의 혈통', desc: '모든 위력 +1.', mods: { powerAll: 1 } },
    viv_e3: { char: 'vivienne', tier: 3, name: '어머니의 자장가', desc: '시작 심지 +10, 격돌 승리 시 심지 +2.', mods: { startResolve: 10, resolveOnWin: 2 } },

    rol_e1: { char: 'roland', tier: 1, name: '표시해 둔 패', desc: '전투 시작 잔광 +40.', mods: { startGlow: 40 } },
    rol_e2: { char: 'roland', tier: 2, name: '배짱', desc: '격돌 승리 시 심지 +4.', mods: { resolveOnWin: 4 } },
    rol_e3: { char: 'roland', tier: 3, name: '판돈 올리기', desc: '「올인」 위력 +3, 속도 +1.', mods: { skillPower: { rol_s3: 3 }, speed: 1 } },

    mir_e1: { char: 'mireille', tier: 1, name: '은혜', desc: '치유량 +3.', mods: { healPlus: 3 } },
    mir_e2: { char: 'mireille', tier: 2, name: '오라버니의 검', desc: '모든 위력 +1, 속도 +1.', mods: { powerAll: 1, speed: 1 } },
    mir_e3: { char: 'mireille', tier: 3, name: '꺼지지 않는 등', desc: '시작 심지 +10, 격돌 승리 시 잔광 +5.', mods: { startResolve: 10, glowOnWin: 5 } },

    ser_e1: { char: 'seraphine', tier: 1, name: '저장 지점', desc: '최대 체력 +15%.', mods: { hpPct: 0.15 } },
    ser_e2: { char: 'seraphine', tier: 2, name: '빈칸의 가능성', desc: '점화 확률 +6%, 모든 위력 +1.', mods: { lampProb: 0.06, powerAll: 1 } },
    ser_e3: { char: 'seraphine', tier: 3, name: '자기 이름', desc: '시작 심지 +15.', mods: { startResolve: 15 } }
  };

  /** 단련(장비 강화): 단계당 공격 +5%, 체력 +5%. 성흔 파편 소모. */
  D.upgradeCost = [3, 5, 8, 12, 16];
  D.upgradeMax = 5;
  D.weapons = {
    lennox: '아버지의 낡은 장검', kaien: '직접 두드린 방패', vivienne: '로셰가의 서리 지팡이',
    roland: '표시해 둔 주사위', mireille: '교회의 은 지팡이', seraphine: '지급품 연습검'
  };
})(typeof window !== 'undefined' ? window : globalThis);
