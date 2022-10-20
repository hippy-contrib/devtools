/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

/* globals __webpack_hash__ */
if (module.hot) {
  var lastHash;

  var upToDate = function upToDate() {
    return lastHash.indexOf(__webpack_hash__) >= 0;
  };

  var log = require('./log');

  var applyReload = require('../utils/apply-reload').default;

  var check = function check() {
    module.hot.check().then(function (updatedModules) {
      if (!updatedModules) {
        log('warning', '[HMR] Cannot find update. Need to do a full reload!');
        log('warning', '[HMR] (Probably because of restarting the webpack-dev-server)');
        applyReload();
        return;
      }

      return module.hot.apply({
        ignoreUnaccepted: true,
        ignoreDeclined: true,
        ignoreErrored: true,
        onUnaccepted: function onUnaccepted(data) {
          log('warning', "Ignored an update to unaccepted module ".concat(data.chain.join(' -> ')));
        },
        onDeclined: function onDeclined(data) {
          log('warning', "Ignored an update to declined module ".concat(data.chain.join(' -> ')));
        },
        onErrored: function onErrored(data) {
          log('error', data.error);
          log('warning', "Ignored an error while updating module ".concat(data.moduleId, " (").concat(data.type, ")"));
        }
      }).then(function (renewedModules) {
        if (!upToDate()) {
          check();
        }

        require('./log-apply-result')(updatedModules, renewedModules);

        if (upToDate()) {
          log('info', '[HMR] App is up to date.');
        }
      });
    }).catch(function (err) {
      var status = module.hot.status();

      if (['abort', 'fail'].indexOf(status) >= 0) {
        log('warning', '[HMR] Cannot check for update. Need to do a full reload!');
        log('warning', "[HMR] ".concat(log.formatError(err)));
        applyReload();
      } else {
        log('warning', "[HMR] Update check failed: ".concat(log.formatError(err)));
      }
    });
  };

  var hotEmitter = require('./emitter');

  hotEmitter.on('webpackHotUpdate', function (currentHash) {
    lastHash = currentHash;

    if (!upToDate() && module.hot.status() === 'idle') {
      log('info', '[HMR] Checking for updates on the server...');
      check();
    } else {
      applyReload();
    }
  });
  log('info', '[HMR] Waiting for update signal from WDS...');
} else {
  throw new Error('[HMR] Hot Module Replacement is disabled.');
}