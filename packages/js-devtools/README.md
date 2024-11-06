# vanilla-js-devtools

Hippy devtools backend for Network, Storage, Cookie, Log. Support in non-XCode compiled App. This is implemented by JS environment, inject and hook the above API, send CDP in the hooks to devtools frontend.

# Usage

this package is imported by `@hippy/debug-server-next`, you could enable by config in webpack.config.js: 

```js
module.exports = {
  devServer: {
    // by default is true, you could set false to disable this feature.
    injectJSDevtools: false,
    // or specific domain list to inspect Cookie.
    injectJSDevtools: {
      domains: ['https://hippyjs.org', 'https://qq.com'],
    }
  }
}
```
