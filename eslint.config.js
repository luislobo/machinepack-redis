/**
 * ESLint configuration (flat config format)
 * Modern replacement for .eslintrc
 */

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      '.nyc_output/**',
      'dist/**',
      'build/**'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Mocha globals
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    },
    rules: {
      // Callbacks
      'callback-return': ['error', ['callback', 'cb', 'next', 'done', 'proceed']],
      'handle-callback-err': 'error',

      // Code style
      'camelcase': ['error', { 'properties': 'always' }],
      'comma-style': ['error', 'last'],
      'curly': 'error',
      'eqeqeq': ['warn', 'smart'],
      'eol-last': 'error',
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'linebreak-style': ['error', 'unix'],
      'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
      'no-return-assign': ['error', 'always'],
      'no-sequences': 'error',
      'no-trailing-spaces': 'error',
      'no-undef': 'error',
      'no-unexpected-multiline': 'warn',
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'one-var': ['error', 'never'],
      'semi': ['warn', 'always']
    }
  },
  // Relaxed rules for tests and examples
  {
    files: ['tests/**/*.js', 'test/**/*.js', 'examples/**/*.js'],
    rules: {
      'camelcase': 'off',
      'no-unused-vars': 'warn',
      'handle-callback-err': 'warn',
      'callback-return': 'warn'
    }
  }
];
