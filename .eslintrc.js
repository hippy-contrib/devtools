module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2019,
    sourceType: 'module',
    createDefaultProgram: true,
  },
  extends: [
    'plugin:import/recommended',
    'plugin:import/typescript',
    '@tencent/eslint-config-tencent',
    '@tencent/eslint-config-tencent/ts',
    '@tencent/eslint-config-tencent/prettier',
  ],
  plugins: ['import', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/explicit-member-accessibility': 'warn',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        pathGroups: [
          {
            pattern: '@/**',
            group: 'external',
            position: 'after',
          },
        ],
      },
    ],
  },
  env: {
    // 指定代码的运行环境
    browser: true,
    node: true,
    // 自动启用es6语法和ES6全局变量
    es6: true,
  },
  globals: {},
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
};
