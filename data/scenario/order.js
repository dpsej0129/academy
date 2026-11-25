/* 시나리오 파일 순서. 새 장을 추가하면 여기에 키를 넣고 index.html에 <script>를 추가한다. */
(function (root) {
  'use strict';
  var D = root.GameData = root.GameData || {};
  D.scenario = D.scenario || {};
  D.scenarioOrder = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'epilogue'];
})(typeof window !== 'undefined' ? window : globalThis);
