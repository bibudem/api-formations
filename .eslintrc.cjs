/* eslint-env node */
module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'plugin:eslint-plugin/recommended',
    'prettier',
    'plugin:node-dependencies/recommended',
    'plugin:jsonc/recommended-with-jsonc',
    'plugin:unicorn/recommended',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      plugins: [
        '@babel/plugin-syntax-import-assertions',
      ],
    },
  },
  plugins: ['eslint-plugin', 'prettier', 'unicorn'],
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'unicorn/prevent-abbreviations': [
      'error',
      {
        allowList: {
          bibLabelFromLibCalCampusId: true,
          pkg: true,
          devLogger: true,
        },
      },
    ],
    quotes: ['error', 'single'],
    // Override all options of `prettier` here
    // @see https://prettier.io/docs/en/options.html
    // printWidth: Infinity,
    // proseWrap: 'never',
    // singleQuote: true,
    // semi: false,
    // trailingComma: 'es5',
    // arrowParens: 'avoid',
  },
}
