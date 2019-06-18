const base = require('@umijs/fabric/dist/eslint');

module.exports = {
  ...base,
  rules: {
    ...base.rules,
    'prefer-promise-reject-errors': 0,
    'react/no-array-index-key': 0,
  },
};
