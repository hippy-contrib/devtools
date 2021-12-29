# Hippy Debug Server

![Hippy Group](https://img.shields.io/badge/group-Hippy-blue.svg)

The package provide the debug server communicated with native(Android apk or iOS Simulator) and the local web development.

## Usage

`@hippy/debug-server` can be installed globally, but install to local in most case.

```
npm install -g @hippy/debug-server # Install
cd hippy-react-demo               # Change to a hippy-react project folder.
hippy-debug                       # Start the debug server
```

If you use custom cli, you could customize like this:

```javascript
const { webpack, startDebugServer } = require('@hippy/debug-server');

// start hippy dev with HMR supported
webpack(webpackConfig, (err, stats) => {
  // add you custom callback here...
});

// start hippy debug
startDebugServer();
```
