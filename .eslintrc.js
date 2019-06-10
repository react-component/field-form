const base = require('father/template/.eslintrc.js');

base.rules['promise/always-return'] = 0;
base.rules['promise/catch-or-return'] = 0;
base.rules['prefer-promise-reject-errors'] = 0;

module.exports = base;