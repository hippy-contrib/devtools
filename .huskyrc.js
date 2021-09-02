/**
 * README: !!!!!!!!!
 *
 * husky: https://github.com/typicode/husky#readme
 * git-hooks: https://git-scm.com/book/zh/v2/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-Git-%E9%92%A9%E5%AD%90
 * commitlint: https://github.com/conventional-changelog/commitlint#readme
 */

const tasks = arr => arr.join(' && ');

module.exports = {
  hooks: {
    'pre-commit': 'npx lint-staged',
    'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS',
  },
};
