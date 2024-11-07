# @hippy/hippy-react-devtools-plugin

> support react devtools in Hippy

## Usage

```js
const HippyReactDevtoolsPlugin = require('@hippy/hippy-react-devtools-plugin');

module.exports = {
  // add this plugin to webpack config
  plugins: [
    // note this plugin must create before of '@hippy/hippy-react-refresh-webpack-plugin' if you use hmr
    new HippyReactDevtoolsPlugin({
      protocol: 'http',
      host: 'localhost',
      port: 38989,
    }),
  ],
  // or use @hippy/debug-server-next to auto enable this plugin
  devServer: {
    remote: {
      protocol: 'http',
      host: 'localhost',
      port: 38989,
    },
    reactDevtools: true,
  }
}
```

## Development

```bash
# build for development in watch mode
yarn start
# build for production
yarn build
```
