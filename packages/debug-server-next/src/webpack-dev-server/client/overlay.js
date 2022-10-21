// The error overlay is inspired (and mostly copied) from Create React App (https://github.com/facebookincubator/create-react-app)
// They, in turn, got inspired by webpack-hot-middleware (https://github.com/glenjamin/webpack-hot-middleware).
// Successful compilation.
function hide() {}

function formatProblem(type, item) {
  var header = type === 'warning' ? 'WARNING' : 'ERROR';
  var body = '';

  if (typeof item === 'string') {
    body += item;
  } else {
    var file = item.file || ''; // eslint-disable-next-line no-nested-ternary

    var moduleName = item.moduleName ? item.moduleName.indexOf('!') !== -1 ? "".concat(item.moduleName.replace(/^(\s|\S)*!/, ''), " (").concat(item.moduleName, ")") : "".concat(item.moduleName) : '';
    var loc = item.loc;
    header += "".concat(moduleName || file ? " in ".concat(moduleName ? "".concat(moduleName).concat(file ? " (".concat(file, ")") : '') : file).concat(loc ? " ".concat(loc) : '') : '');
    body += item.message || '';
  }

  return {
    header: header,
    body: body
  };
} // Compilation with errors (e.g. syntax error or missing modules).


function show() {}

export { formatProblem, show, hide };