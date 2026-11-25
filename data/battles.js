/* 전투 정의. 시나리오에서 `@battle <id>`로 호출한다.
 *  level: 아군 레벨(장 진행도). 체력·공격 배율에 반영
 *  enemies: 적 ID 또는 { id, hpMult, name }
 *  maxParty: 출전 인원 / forced: 반드시 출전 / fixed: 편성 화면 없이 고정 / guests: 이번 전투만 합류 가능
 *  mods: [{ if: '조건식', enemy, hpMult, dice }] 스토리 선택에 따른 보정
 *  winCondition: { type: 'survive', turns } 생존형 승리 조건
 *  events: [{ turn, speaker, text }] 전투 중 대사
 *  reward: 성흔 파편(단련 재료)
 */
(function (root) {
  'use strict';
  var D = root.GameData = root.GameData || {};

  D.battles = {
    // ================================================================ 프롤로그
    p_b1: {
      name: '입학 시험 — 속삭임 숲', tier: 'mob', bg: 'forest_day', level: 1,
      enemies: ['ink_rat', 'ink_rat'], fixed: ['lennox', 'kaien'], reward: 3, tutorial: 'basic',
      intro: '누락 쥐 두 마리. 속도가 더 빠르면 적의 공격을 가로채 격돌할 수 있다.',
      events: [
        { turn: 1, speaker: '카이엔', text: '쥐새끼 주제에 눈빛이 왜 저래? 하얗잖아!' },
        { turn: 2, speaker: '레녹스', text: '(격돌에서 이기면 심지가 오른다. 심지가 높을수록 등불이 잘 켜진다.)' }
      ]
    },
    p_b2: {
      name: '이름을 먹는 개', tier: 'boss', bg: 'forest_rift', level: 1,
      enemies: ['name_hound'], fixed: ['lennox', 'kaien', 'seraphine', 'vivienne'], guests: ['seraphine', 'vivienne'],
      reward: 5, tutorial: 'boss',
      intro: '보스는 한 턴에 여러 번 행동한다. 같은 속성 기술을 함께 쓰면 「화음」이 붙는다.',
      events: [
        { turn: 1, speaker: '비비안', text: '그레이번 경, 방해만 하지 마시죠.' },
        { turn: 2, speaker: '세라핀', text: '【튜토리얼 전투를 개시합니다.】 …어? 제가 지금 뭐라고 했죠?' },
        { turn: 4, speaker: '레녹스', text: '(잔광이 가득 차면 극의를 쓸 수 있다. 아끼지 마라.)' }
      ]
    },

    // ================================================================ 1장
    c1_b1: {
      name: '검술 실습 — 대련 인형', tier: 'mob', bg: 'training_yard', level: 2,
      enemies: ['training_doll', 'training_doll', 'training_doll'], fixed: ['lennox', 'kaien'], reward: 3,
      intro: '마그다 교관의 실습. 체력이 일정 구간 아래로 떨어지면 자세가 무너져 1턴 동안 행동할 수 없다.',
      events: [{ turn: 1, speaker: '마그다', text: '굼벵이들아! 인형한테 지면 오늘 저녁은 없다!' }]
    },
    c1_b2: {
      name: '무도회 뒤뜰 — 브루노 일당', tier: 'elite', bg: 'ballroom_garden', level: 2,
      enemies: ['thug', 'bruno', 'thug'], maxParty: 3, forced: ['lennox'], guests: [], reward: 4,
      mods: [{ if: 'flag.mocked', enemy: 'bruno', hpMult: 1.2 }],
      intro: '브루노는 자기보다 느린 공격을 가로챈다(반격 태세).',
      events: [{ turn: 1, speaker: '브루노', text: '반역자 집안 개가 무도회에 왜 기어들어 왔지?' }]
    },
    c1_b3: {
      name: '호숫가 야간 순찰', tier: 'mob', bg: 'lake_night', level: 2,
      enemies: ['ink_leech', 'lake_shade', 'hollow_armor', 'ink_leech'], maxParty: 3, forced: ['lennox', 'mireille'], reward: 4,
      events: [
        { turn: 1, speaker: '미레유', text: '오라버니, 다치시면 제가… 아니, 다치지 마세요.' },
        { turn: 3, speaker: '교복 입은 그림자', text: '…애…셔… …애…셔…' }
      ]
    },
    c1_b4: {
      name: '중간 평가 — 감독관 인형', tier: 'boss', bg: 'arena', level: 2,
      enemies: ['warden_arm_l', 'warden', 'warden_arm_r'], maxParty: 4, forced: ['lennox'], reward: 6,
      mods: [{ if: 'flag.mocked', enemy: 'warden', hpMult: 1.15 }],
      intro: '양팔(부위)이 살아있는 동안 본체가 받는 피해가 크게 줄어든다. 팔부터 부숴라.',
      events: [
        { turn: 1, speaker: '감독관 인형', text: '【평가 대상 확인. …오류. 레녹스 그레이번은 이 장에 존재하지 않아야 합니다.】' },
        { turn: 3, speaker: '핀', text: '그, 그레이번! 오른팔! 오른팔이 내려온다!' }
      ]
    },

    // ================================================================ 2장
    c2_b1: {
      name: '결투제 예선 — 난전', tier: 'mob', bg: 'arena', level: 3,
      enemies: ['cadet', 'cadet', 'cadet'], maxParty: 3, forced: ['lennox'], reward: 4,
      events: [{ turn: 1, speaker: '롤랑', text: '후후, 배당은 그레이번 공에게 1대 9. 제 전 재산을 걸었지요.' }]
    },
    c2_b2: {
      name: '결투제 본선 — 쌍검 쌍둥이', tier: 'elite', bg: 'arena', level: 3,
      enemies: ['twin_odel', 'twin_odil'], maxParty: 3, forced: ['lennox'], reward: 5,
      intro: '한 명을 쓰러뜨리면 남은 쪽이 격앙한다. 둘의 체력을 고르게 깎는 것도 방법이다.',
      events: [{ turn: 1, speaker: '오델', text: '오딜, 왼쪽.' }, { turn: 1, speaker: '오딜', text: '오델, 오른쪽.' }]
    },
    c2_b3: {
      name: '축제의 밤 — 갈까마귀관 습격', tier: 'elite', bg: 'dorm_night', level: 3,
      enemies: ['festival_crawler', 'hollow_student', 'festival_crawler'], maxParty: 4, forced: ['lennox'], reward: 5,
      events: [
        { turn: 1, speaker: '교복 입은 누락체', text: '…카…이…엔…' },
        { turn: 2, speaker: '교복 입은 누락체', text: '왕께서는… 「다시 하기」를… 싫어하신다…' }
      ]
    },
    c2_b4: {
      name: '결투제 결승 — 학생회장 율리안', tier: 'boss', bg: 'arena_final', level: 3,
      enemies: ['julian'], maxParty: 3, forced: ['lennox'], reward: 8,
      intro: '율리안은 빠르고, 느린 공격을 가로챈다. 체력 50% 이하에서 검집을 벗는다.',
      events: [{ turn: 1, speaker: '율리안', text: '그레이번. 너는 1장에서 죽었어야 했다.' }]
    },

    // ================================================================ 3장
    c3_b1: {
      name: '장막 실습 — 요새 외곽', tier: 'mob', bg: 'fortress', level: 4,
      enemies: ['margin_crawler', 'margin_crawler', 'margin_crawler'], maxParty: 4, forced: ['lennox'], reward: 5,
      events: [{ turn: 1, speaker: '비비안', text: '하얗네요. 피도, 비명도.' }]
    },
    c3_b2: {
      name: '흰 등대의 파수견', tier: 'elite', bg: 'lighthouse', level: 4,
      enemies: ['margin_crawler', 'margin_hound'], maxParty: 4, forced: ['lennox'], reward: 6,
      events: [{ turn: 2, speaker: '카이엔', text: '저 개, 등대 쪽을 지키는 거야, 아니면 막는 거야?' }]
    },
    c3_b3a: {
      name: '제국의 그림자', tier: 'elite', bg: 'fortress_night', level: 4,
      enemies: ['imperial_agent', 'imperial_captain', 'imperial_agent'], maxParty: 4, forced: ['lennox', 'roland'], reward: 6,
      events: [
        { turn: 1, speaker: '제국 첩보대장', text: '베르니에. 네 어머니의 목숨값을 잊었나.' },
        { turn: 1, speaker: '롤랑', text: '후후. 판을 바꿨습니다. 이번엔 제 돈으로요.' }
      ]
    },
    c3_b3b: {
      name: '배신의 밤 — 롤랑', tier: 'elite', bg: 'fortress_night', level: 4,
      enemies: ['imperial_agent', 'roland_foe', 'imperial_agent'], maxParty: 4, forced: ['lennox'], reward: 6,
      events: [{ turn: 1, speaker: '롤랑', text: '미안합니다, 친애하는 그레이번 공. 판돈이 너무 컸어요.' }]
    },
    c3_b4: {
      name: '금서고 — 서가의 망령', tier: 'mob', bg: 'archive', level: 4,
      enemies: ['page_wraith', 'bookworm', 'page_wraith'], maxParty: 4, forced: ['lennox'], reward: 5
    },
    c3_b5: {
      name: '이름 없는 성가대', tier: 'boss', bg: 'archive_choir', level: 4,
      enemies: ['choir_soprano', 'choir_alto', 'choir_conductor', 'choir_bass'], maxParty: 4, forced: ['lennox'], reward: 9,
      intro: '세 성가대원이 모두 살아있으면 매 턴 끝에 합창(심지 -6, 침식). 하나라도 먼저 쓰러뜨려라.',
      events: [{ turn: 1, speaker: '성가대', text: '♪ 핀… 마르타… 엘레노어… 우리는… 기억되지… 않았네…' }]
    },

    // ================================================================ 4장
    c4_b1: {
      name: '개찬된 학생들', tier: 'mob', bg: 'corridor', level: 5,
      enemies: ['rewritten_student', 'bruno_rewritten', 'rewritten_student'], maxParty: 4, forced: ['lennox'], reward: 6,
      mods: [{ if: 'flag.hester_named', enemy: 'bruno_rewritten', hpMult: 1.25, dice: 1 }],
      events: [{ turn: 1, speaker: '개찬된 학생', text: '【오류를 수정합니다. 오류를 수정합니다.】' }]
    },
    c4_b2: {
      name: '감독관 개량형', tier: 'elite', bg: 'courtyard_snow', level: 5,
      enemies: ['warden_mk2'], maxParty: 4, forced: ['lennox'], reward: 7,
      events: [{ turn: 1, speaker: '감독관 개량형', text: '【오류 레녹스 그레이번. 이번에는 확실히.】' }]
    },
    c4_b3: {
      name: '겨울 무도회 — 무너진 장막', tier: 'mob', bg: 'ballroom_ruin', level: 5,
      enemies: ['margin_crawler', 'ink_squire', 'margin_crawler'], maxParty: 4, forced: ['lennox'], reward: 6,
      events: [{ turn: 1, speaker: '비비안', text: '천장이… 하얗게 지워지고 있어요.' }]
    },
    c4_b4a: {
      name: '갈까마귀관 사수', tier: 'elite', bg: 'dorm_night', level: 5,
      enemies: ['margin_crawler', 'margin_hound', 'margin_crawler'], maxParty: 4, forced: ['lennox', 'kaien'], reward: 7,
      winCondition: { type: 'survive', turns: 5, text: '새벽 종이 울렸다. 누락체들이 물러난다!' },
      intro: '5턴 동안 버티면 승리. (전부 쓰러뜨려도 승리)',
      events: [{ turn: 1, speaker: '카이엔', text: '왔냐, 그레이번! 늦었잖아, 임마!' }]
    },
    c4_b4b: {
      name: '시계탑 계단 — 장부의 집행관', tier: 'elite', bg: 'clocktower_stairs', level: 5,
      enemies: ['page_wraith', 'ledger_executor'], maxParty: 4, forced: ['lennox'], reward: 7,
      events: [{ turn: 1, speaker: '장부의 집행관', text: '【성객 회수 중. 열람자는 물러나십시오.】' }]
    },
    c4_b5: {
      name: '관리인 오스왈드 벨그레이브', tier: 'boss', bg: 'clocktower_top', level: 5,
      enemies: ['belgrave'], maxParty: 4, forced: ['lennox'], reward: 10,
      mods: [{ if: 'flag.julian_ally', enemy: 'belgrave', hpMult: 0.85 }],
      intro: '3턴마다 심지가 가장 높은 아군의 심지를 뒤집는다(개찬). 심지를 한 명에게 몰아주지 마라.',
      events: [
        { turn: 1, speaker: '학장', text: '허허. 얘야, 이 늙은이는 너를 미워한 적이 없단다.' },
        { turn: 3, speaker: '학장', text: '그 확신도, 고쳐 쓰면 그만이지.' }
      ]
    },

    // ================================================================ 5장
    c5_b1: {
      name: '여백의 해안', tier: 'mob', bg: 'margin_shore', level: 6,
      enemies: ['margin_crawler', 'hollow_noble', 'margin_crawler'], maxParty: 4, forced: ['lennox'], reward: 6
    },
    c5_b2: {
      name: '검은 잉크의 기사', tier: 'elite', bg: 'ink_corridor', level: 6,
      enemies: ['ink_knight'], maxParty: 4, forced: ['lennox'], reward: 8,
      events: [{ turn: 1, speaker: '검은 기사', text: '…세이브… 포인트… 여기… 없어…' }]
    },
    c5_b3: {
      name: '각본의 성객', tier: 'boss', bg: 'ink_corridor', level: 6,
      enemies: ['scripted_seraphine'], maxParty: 4, forced: ['lennox'], reward: 8,
      events: [{ turn: 1, speaker: '세라핀', text: '【메인 퀘스트: 레녹스 그레이번을 처치하라. 보상: 귀환.】' }]
    },
    c5_b4: {
      name: '잿빛 왕', tier: 'boss', bg: 'ashen_throne', level: 6,
      enemies: ['ashen_king'], maxParty: 4, forced: ['lennox'], reward: 10,
      mods: [{ if: 'flag.named_king', enemy: 'ashen_king', hpMult: 0.8 }],
      intro: '잿빛 왕은 한 번 쓰러져도 컨티뉴한다.',
      events: [
        { turn: 1, speaker: '잿빛 왕', text: '자, 보스전이다. 패턴은 알지? 모르면 지금 외워.' },
        { turn: 4, speaker: '잿빛 왕', text: '야, 신입. 너 극의 아끼는 타입이지. 나도 그랬어.' }
      ]
    },
    c5_b5: {
      name: '별의 장부', tier: 'boss', bg: 'ledger_heart', level: 6,
      enemies: ['ledger_quill', 'ledger', 'ledger_ink'], maxParty: 4, forced: ['lennox'], reward: 0,
      mods: [
        { if: 'flag.blueprint', enemy: 'ledger', hpMult: 0.8 },
        { if: 'flag.blueprint', enemy: 'ledger_quill', hpMult: 0.6 },
        { if: 'flag.blueprint', enemy: 'ledger_ink', hpMult: 0.6 }
      ],
      intro: '2턴마다 각자 가장 많이 쓴 기술이 봉인된다. 펜과 잉크병이 본체를 지킨다.',
      events: [
        { turn: 1, speaker: '장부', text: '【제48장. 결말을 기록할 준비가 되었습니다.】' },
        { turn: 2, speaker: '레녹스', text: '(봉인된다면, 다른 걸로 싸우면 된다. 원작은 이미 끝났다.)' }
      ]
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
