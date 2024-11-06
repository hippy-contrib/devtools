import each from 'licia/each';
import isStr from 'licia/isStr';
import once from 'licia/once';
import connector from '../lib/connector';
import { getDomains } from '../lib/domain';
import { hookFunction } from '../lib/hook';
import { triggerFrameUpdated } from '../domains/Page';

let enabled = false;

export const enable = function () {
  /**
   * send frame list when App reload or connect
   */
  triggerFrameUpdated();

  // log.info('enable LocalStorage devtools'); 
  enabled = true;
};

export async function clear(params: any) {
  const { storageId } = params;
  const store = getStore(storageId);
  if (!store) return;

  const allKeys = await store.getAllKeys();
  store.storageId = storageId;
  store.multiRemove(allKeys);
}

export async function getDOMStorageItems(params: any) {
  const store = getStore(params.storageId);
  if (!store) return { entries: [] };

  const allKeys = await store.getAllKeys();
  const entries: string[][] = await store.multiGet(allKeys);
  return { entries };
}

export function removeDOMStorageItem(params: any) {
  const { key, storageId } = params;
  const store = getStore(storageId);
  if (!store) return;

  if (!isStr(key) || !key) return;
  store.storageId = storageId;
  store.removeItem(key);
}

export function setDOMStorageItem(params: any) {
  const { key, value, storageId } = params;
  const store = getStore(storageId);
  if (!store) return;

  if (!isStr(key) || !isStr(value) || !value || !key) return;
  store.storageId = storageId;
  store.setItem(key, value);
}

function getStorageId() {
  // hippy AsyncStorage doesn't group by domain, so always use the first domain here.
  const origins = getDomains();
  return {
    securityOrigin: origins[0],
    isLocalStorage: true,
  };
}

function getStore(storageId: any) {
  const { isLocalStorage } = storageId;
  return isLocalStorage ? localStorage : null;
}

async function triggerUpdateStorageItem({ key, newValue, storageId }) {
  const oldValue = await localStorage.getItem(key);
  if (oldValue) {
    connector.trigger('DOMStorage.domStorageItemUpdated', {
      key,
      newValue,
      oldValue,
      storageId,
    });
  } else {
    connector.trigger('DOMStorage.domStorageItemAdded', {
      key,
      newValue,
      storageId,
    });
  }
}

async function triggerRemoveStorageItem({ key, storageId }) {
  const oldValue = await localStorage.getItem(key);
  if (oldValue) {
    connector.trigger('DOMStorage.domStorageItemRemoved', {
      key,
      storageId,
    });
  }
}

export const hookLocalStorage = once(() => {
  const storageId = getStorageId();

  hookFunction(localStorage, 'setItem', {
    before: function (ctx, key: string, value: string) {
      if (!enabled || !isStr(key) || !isStr(value)) return;
      // get storageId from hook context
      triggerUpdateStorageItem({ key, newValue: value, storageId: this.storageId || storageId });
    }
  });

  hookFunction(localStorage, 'removeItem', {
    before: function (ctx, key: string) {
      if (!enabled || !isStr(key)) return;
      triggerRemoveStorageItem({ key, storageId: this.storageId || storageId });
    }
  });

  hookFunction(localStorage, 'multiSet', {
    before: function (ctx, kvPairs: [string, string][]) {
      if(!enabled) return;

      each(kvPairs, ([key, newValue]) => {
        if (!isStr(key) || !isStr(newValue)) return;
        triggerUpdateStorageItem({ key, newValue, storageId: this.storageId || storageId });
      });
    }
  });

  hookFunction(localStorage, 'multiRemove', {
    before: function (ctx, keys: string[]) {
      each(keys, key => {
        triggerRemoveStorageItem({ key, storageId: this.storageId || storageId });
      });
    }
  });
});
