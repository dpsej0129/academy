/* 배경·CG 목록. 이미지가 없을 때 color(그라데이션 시작색)와 name이 대신 표시된다.
 * 경로 규칙: 배경 assets/bg/<id>.png, CG assets/cg/<id>.png */
(function (root) {
  'use strict';
  var D = root.GameData = root.GameData || {};

  D.backgrounds = {
    black:             { name: '', color: '#000000' },
    room_earth:        { name: '도윤의 원룸 · 새벽 3시', color: '#1b1e2a' },
    dorm_room:         { name: '갈까마귀관 · 2인실', color: '#3a3128' },
    dorm_hall:         { name: '갈까마귀관 · 라운지', color: '#3b2f25' },
    dorm_night:        { name: '갈까마귀관 · 밤', color: '#161722' },
    academy_gate:      { name: '베스퍼홀 · 호수 다리', color: '#4b6a86' },
    forest_day:        { name: '속삭임 숲', color: '#2e4a33' },
    forest_rift:       { name: '속삭임 숲 · 균열', color: '#3c3a46' },
    training_yard:     { name: '기사과 훈련장', color: '#6b5a40' },
    classroom:         { name: '마도과 강의실', color: '#4a4036' },
    library:           { name: '대도서관', color: '#3f3326' },
    infirmary:         { name: '신성과 치유동', color: '#c7c0ac' },
    ballroom:          { name: '대강당 · 환영 무도회', color: '#6a4b2a' },
    ballroom_garden:   { name: '대강당 뒤뜰', color: '#1f2e24' },
    lake_day:          { name: '거울 호수', color: '#5d86a6' },
    lake_night:        { name: '거울 호수 · 밤', color: '#132036' },
    arena:             { name: '원형 결투장 「붉은 원」', color: '#7a4a35' },
    arena_final:       { name: '붉은 원 · 결승의 밤', color: '#4a1f22' },
    arena_hall:        { name: '결투장 회랑 · 우승자 명패', color: '#3a2a22' },
    tea_room:          { name: '백조관 · 다과실', color: '#b8b0c8' },
    clocktower:        { name: '옛 시계탑', color: '#2f2b28' },
    clocktower_stairs: { name: '시계탑 계단', color: '#26221f' },
    clocktower_top:    { name: '시계탑 꼭대기', color: '#1d2433' },
    headmaster_office: { name: '학장실', color: '#4a3b2b' },
    carriage:          { name: '마차 안', color: '#4a3a2e' },
    fortress:          { name: '흰 등대 요새', color: '#a9b0b5' },
    fortress_night:    { name: '흰 등대 요새 · 밤', color: '#20262e' },
    lighthouse:        { name: '흰 등대 꼭대기', color: '#d7d9d6' },
    archive:           { name: '금서고', color: '#2a2219' },
    archive_choir:     { name: '금서고 · 성가대석', color: '#1d1a24' },
    archive_deep:      { name: '장부의 바깥 페이지', color: '#c9bb8c' },
    corridor:          { name: '본관 복도', color: '#5a5a62' },
    courtyard_snow:    { name: '눈 덮인 안뜰', color: '#c6ccd4' },
    dream_mirror:      { name: '꿈 · 거울의 방', color: '#22283a' },
    margin_shore:      { name: '여백의 해안', color: '#eeeeea' },
    memory_classroom:  { name: '기억의 교실', color: '#e2d9c4' },
    ink_corridor:      { name: '잉크의 회랑', color: '#0e0e16' },
    ashen_throne:      { name: '잿빛 왕좌', color: '#3a3a3e' },
    ledger_heart:      { name: '장부의 심장', color: '#d8c27a' },
    spring_academy:    { name: '봄의 베스퍼홀', color: '#d9b8c4' },
    white_void:        { name: '하얀 여백', color: '#f4f4f0' }
  };

  D.cgs = {
    cg_awaken:       { name: '거울 속 낯선 얼굴', color: '#3a3128' },
    cg_carving:      { name: '시계탑의 한글 낙서', color: '#2f2b28' },
    cg_empty_bed:    { name: '아무도 기억하지 않는 침대', color: '#3a3128' },
    cg_reveal:       { name: '제47장의 마지막 페이지', color: '#c9bb8c' },
    cg_hester:       { name: '지워지는 사서', color: '#2a2219' },
    cg_winter_ball:  { name: '겨울 무도회', color: '#c6ccd4' },
    cg_kaien_last:   { name: '갈까마귀관의 문', color: '#161722' },
    cg_ashen_name:   { name: '이름을 불린 왕', color: '#3a3a3e' },
    ending_true:     { name: 'TRUE END · 이름을 부르는 자', color: '#d9b8c4' },
    ending_normal:   { name: 'NORMAL END · 여백의 봄', color: '#eeeeea' },
    ending_bad:      { name: 'BAD END · 제49장', color: '#3a3a3e' }
  };

  D.endings = {
    true:   { title: '이름을 부르는 자', label: 'TRUE END', cg: 'ending_true' },
    normal: { title: '여백의 봄', label: 'NORMAL END', cg: 'ending_normal' },
    bad:    { title: '제49장', label: 'BAD END', cg: 'ending_bad' }
  };
})(typeof window !== 'undefined' ? window : globalThis);
