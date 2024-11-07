# Hippy HMR Plugin

support hmr of @hippy/vue, @hippy/react

@hippy/vue, @hippy/react version >= 2.2.2

# How to use
This plugin should use together with [hippy vue loader](https://github.com/Tencent/Hippy/tree/master/packages/hippy-vue-loader), [hippy react refresh webpack plugin](https://github.com/hippy-contrib/hippy-react-refresh-webpack-plugin) and [hipp debug server](https://github.com/Tencent/Hippy/tree/master/packages/hippy-debug-server), an example webpack config like this:

```js
const HippyHMRPlugin = require('@hippy/hippy-hmr-plugin');
const VueLoaderPlugin = require('@hippy/vue-loader/lib/plugin');
const vueLoader = '@hippy/vue-loader';

module.exports = {
  devServer: {                    
    hot: true,
    devMiddleware: {
      writeToDisk: true,
    },
  },
  output: {
    filename: 'index.bundle',
    path: path.resolve('./dist/dev/'),
    // you must set publicPath to load hmr chunk
    publicPath: 'http://localhost:38989/',
    globalObject: '(0, eval)("this")',
  },
  plugins: [
    new VueLoaderPlugin(),
    new HippyHMRPlugin(),
    // other plugin here
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: [
          vueLoader,
        ],
      },
    ],
    // other loaders
  }
}
```
