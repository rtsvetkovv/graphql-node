module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'arrow-parens': 0,
    'no-console': 0,
    'no-param-reassign': 0,
    'consistent-return': 0,
    'prefer-promise-reject-errors': 0,
    'no-underscore-dangle': 0,
    'global-require': 0,
  },
};
