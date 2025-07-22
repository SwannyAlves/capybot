const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'no-console': 'off',
      'no-undef': 'error',
      
      'prefer-const': 'warn',
      'no-var': 'warn',
      'eqeqeq': ['warn', 'always'],

      'quotes': 'off',
      'semi': 'off',
      'indent': 'off',
      'comma-dangle': 'off',
    },
    ignores: [
      'node_modules/',
      'auth_info/',
      'temp/',
      '*.log',
    ],
  },
];