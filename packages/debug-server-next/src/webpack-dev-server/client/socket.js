import WebSocketClient from './clients/WebSocketClient';
import { log } from './utils/log';
var retries = 0;
var maxRetries = 10;
var client = null;

var socket = function initSocket(url, handlers, reconnect) {
  client = new WebSocketClient(url);
  maxRetries = reconnect;
  client.onOpen(function () {});
  client.onClose(function (reason) {
    log.warn(reason);

    if (retries === 0) {
      handlers.close();
    } // Try to reconnect.


    client = null; // After 10 retries stop trying, to prevent logspam.

    if (retries < maxRetries) {
      // Exponentially increase timeout to reconnect.
      // Respectfully copied from the package `got`.
      // eslint-disable-next-line no-mixed-operators, no-restricted-properties
      var retryInMs = 1000 * Math.pow(2, retries) + Math.random() * 100;
      retries += 1;
      log.info('Trying to reconnect...');
      setTimeout(function () {
        socket(url, handlers, reconnect);
      }, retryInMs);
    }
  });
  client.onMessage(function (data) {
    retries = 0;
    var hmrData = JSON.parse(data);
    log.info(hmrData);
    if (!hmrData.messages || hmrData.messages.length === 0) return;
    hmrData.messages.forEach(function (message) {
      if (handlers[message.type]) {
        handlers[message.type](message.data, message.params);
      }
    });
  });
};

export default socket;