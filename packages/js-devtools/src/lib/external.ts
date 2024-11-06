/**
 * import optionalDependencies
 * if module is not install in consumer project, will only print warning
 * https://docs.npmjs.com/cli/v7/configuring-npm/package-json#optionaldependencies
 * https://github.com/webpack/webpack/issues/339
 */
let Vue, NetworkModule;
// try {
//   Vue = require('@hippy/vue').default;
// } catch(e) {}
// try {
//   NetworkModule = require('@hippy/react').NetworkModule;
// } catch(e) {}
//
export { Vue, NetworkModule };
