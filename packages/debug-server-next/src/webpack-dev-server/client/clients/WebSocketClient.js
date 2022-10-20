function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

import { log } from '../utils/log';

var WebSocketClient = /*#__PURE__*/function () {
  function WebSocketClient(url) {
    _classCallCheck(this, WebSocketClient);

    log.info('hmr url: ', url);
    this.client = new global.WebSocket(url);

    this.client.onerror = function (error) {
      log.error(error);
    };
  }

  _createClass(WebSocketClient, [{
    key: "onOpen",
    value: function onOpen(f) {
      if (this.client) this.client.onopen = f;
    }
  }, {
    key: "onClose",
    value: function onClose(f) {
      if (this.client) this.client.onclose = f;
    } // call f with the message string as the first argument

  }, {
    key: "onMessage",
    value: function onMessage(f) {
      if (this.client) {
        this.client.onmessage = function (e) {
          f(e.data);
        };
      }
    }
  }]);

  return WebSocketClient;
}();

export { WebSocketClient as default };