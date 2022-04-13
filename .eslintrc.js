const base = require('@umijs/fabric/dist/eslint');

module.exports = {
  ...base,
  rules: {
    ...base.rules,
    'arrow-parens': 0,
    'no-confusing-arrow': 0,
    'no-template-curly-in-string': 0,
    'prefer-promise-reject-errors': 0,
    'react/no-array-index-key': 0,
    'react/sort-comp': 0,
    'import/no-named-as-default-member': 0,
    'jsx-a11y/label-has-for': 0,
    'jsx-a11y/label-has-associated-control': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-unresolved': 0,
    '@typescript-eslint/no-redeclare': 0,
    '@typescript-eslint/method-signature-style': 0,
    'no-async-promise-executor': 0,
    '@typescript-eslint/consistent-type-definitions': 0,
  },
};
