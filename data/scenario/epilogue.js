(function (root) {
  'use strict';
  var D = root.GameData = root.GameData || {};
  D.scenario = D.scenario || {};
  D.scenario.epilogue = `
@ending normal
`;
})(typeof window !== 'undefined' ? window : globalThis);
