/**
 * readme: https://github.com/conventional-changelog/commitlint#readme
 * rules: https://github.com/conventional-changelog/commitlint/blob/master/docs/reference-rules.md
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'revert',
        'ci',
        'build',
        'format',
        'lint',
        'perf',
        'chore',
        'report',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
  },
};
