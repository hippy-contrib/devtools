var logLevel = 'info';

function dummy() {}

function shouldLog(level) {
  var shouldLog = logLevel === 'info' && level === 'info' || ['info', 'warning'].indexOf(logLevel) >= 0 && level === 'warning' || ['info', 'warning', 'error'].indexOf(logLevel) >= 0 && level === 'error';
  return shouldLog;
}

function logGroup(logFn) {
  return function (level, msg) {
    if (shouldLog(level)) {
      logFn(msg);
    }
  };
}

module.exports = function (level, msg) {
  if (shouldLog(level)) {
    if (level === 'info') {
      console.log(msg);
    } else if (level === 'warning') {
      console.warn(msg);
    } else if (level === 'error') {
      console.error(msg);
    }
  }
};

var group = console.group || dummy;
var groupCollapsed = console.groupCollapsed || dummy;
var groupEnd = console.groupEnd || dummy;
module.exports.group = logGroup(group);
module.exports.groupCollapsed = logGroup(groupCollapsed);
module.exports.groupEnd = logGroup(groupEnd);

module.exports.setLogLevel = function (level) {
  logLevel = level;
};

module.exports.formatError = function (err) {
  var message = err.message;
  var stack = err.stack;

  if (!stack) {
    return message;
  }

  if (stack.indexOf(message) < 0) {
    return "".concat(message, "\n").concat(stack);
  }

  return stack;
};