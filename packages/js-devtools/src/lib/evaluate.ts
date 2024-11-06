import isStr from 'licia/isStr';
import copy from 'licia/copy';
import keys from 'licia/keys';
import each from 'licia/each';

const global: any = {
  copy(value: any) {
    debugger;
    if (!isStr(value)) value = JSON.stringify(value, null, 2);
    copy(value);
  },
  keys: (args) => {

    debugger;
    return keys(args);
  },
};

declare const window: any;

function injectGlobal() {
  each(global, (val, name) => {
    if (window[name]) return;

    window[name] = val;
  });
}

function clearGlobal() {
  each(global, (val, name) => {
    if (window[name] && window[name] === val) {
      delete window[name];
    }
  });
}

export function setGlobal(name: string, val: any) {
  global[name] = val;
}

export default function evaluate(expression: string) {
  let ret;

  injectGlobal();
  try {
    ret = eval.call(window, `(${expression})`);
  } catch (e) {
    ret = eval.call(window, expression);
  }
  clearGlobal();

  return ret;
}
