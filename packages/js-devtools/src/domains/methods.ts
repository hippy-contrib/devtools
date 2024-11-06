import noop from 'licia/noop';
import * as Runtime from './Runtime';
// import * as DOM from './DOM';
// import * as CSS from './CSS';
import * as DOMStorage from './DOMStorage';
import * as Network from './Network';
// import * as Overlay from './Overlay';
// import * as DOMDebugger from './DOMDebugger';
// import * as Debugger from './Debugger';
import * as Storage from './Storage';
import * as Page from './Page';

const methods: any = {
  // 'DOMDebugger.getEventListeners': DOMDebugger.getEventListeners,
  'Log.clear': noop,
  'Log.enable': noop,
  'Log.startViolationsReport': noop,

  'Network.deleteCookies': Network.deleteCookies,
  'Network.enable': Network.enable,
  'Network.getCookies': Network.getCookies,
  'Network.getResponseBody': Network.getResponseBody,
  'Network.setCookie': Network.setCookie,

  // 'Page.getResourceContent': noop,
  'Page.getResourceTree': Page.getResourceTree,

  'Runtime.callFunctionOn': Runtime.callFunctionOn,
  'Runtime.compileScript': noop,
  'Runtime.discardConsoleEntries': Runtime.discardConsoleEntries,
  'Runtime.enable': Runtime.enable,
  'Runtime.evaluate': Runtime.evaluate,
  'Runtime.getIsolateId': noop,
  'Runtime.getProperties': Runtime.getProperties,
  'Runtime.releaseObject': noop,
  'Runtime.releaseObjectGroup': noop,
  'Runtime.runIfWaitingForDebugger': noop,

  'DOMStorage.clear': DOMStorage.clear,
  'DOMStorage.enable': DOMStorage.enable,
  'DOMStorage.getDOMStorageItems': DOMStorage.getDOMStorageItems,
  'DOMStorage.removeDOMStorageItem': DOMStorage.removeDOMStorageItem,
  'DOMStorage.setDOMStorageItem': DOMStorage.setDOMStorageItem,

  'HeapProfiler.enable': noop,

  'Inspector.enable': noop,

  'IndexedDB.enable': noop,
  'IndexedDB.requestDatabaseNames': noop,

  // 'Storage.getUsageAndQuota': Storage.getUsageAndQuota,
  'Storage.trackCacheStorageForOrigin': noop,
  'Storage.trackIndexedDBForOrigin': noop,
  'Storage.clearDataForOrigin': Storage.clearDataForOrigin,
};

export default methods;
