import trim from 'licia/trim';
import each from 'licia/each';
import decodeUriComponent from 'licia/decodeUriComponent';
import once from 'licia/once';
import isStr from 'licia/isStr';
import now from 'licia/now';
import { getFetchSize } from '../lib/request';
import connector from '../lib/connector';
import { hookClass, hookFunction } from '../lib/hook';
import { createId } from '../lib/util';
import { getDomains } from '../lib/domain';
import { getType } from '../lib/request';

const resTxtMap = new Map();
let isEnabled = false;
let cmdQueue: CMD[] = [];

export const enable = once(function () {
  // log.info('enable Network, Cookie devtools');
  isEnabled = true;

  cmdQueue.forEach(cmd => connector.trigger(...cmd));
  cmdQueue = [];
});

export function deleteCookies(cookieItem: CookieItem) {
  const Cookie = getCookieAPI();
  if (!Cookie) {
    return;
  }
  const { name, domain, url} = cookieItem;
  const expireDate = new Date(Date.now() - 100000);
  const origins = getDomains();
  let origin = origins.find(origin => origin.includes(domain));
  if(origin) {
    return Cookie.set(origin, `${name}=`, expireDate);
  }
  if(url && !url.startsWith('http')) {
    Cookie.set(`http://${url}`, `${name}=`, expireDate);
    Cookie.set(`https://${url}`, `${name}=`, expireDate);
  }
}

export async function getCookies(params) {
  const { urls } = params;

  const Cookie = getCookieAPI();
  if (!Cookie) return { cookies: [] };

  const cookies: CookieItem[] = []
  await Promise.all(urls.map(origin => {
    return Cookie.getAll(origin).then(cookie => {
      cookies.push(...parseCookie(cookie, origin))
    });
  }));
  return { cookies };
}

export function getResponseBody(params: any) {
  return {
    base64Encoded: false,
    body: resTxtMap.get(params.requestId),
  };
}

export const getCookieAPI = () => {
  try {
    // @ts-ignore
    const callNative = global.Hippy.bridge.callNative;
    // @ts-ignore
    const callNativeWithPromise = global.Hippy.bridge.callNativeWithPromise;
    return {
      getAll(url) {
        if (!url) {
          throw new TypeError('Cookie.getAll() must have url argument');
        }

        return callNativeWithPromise.call(this, 'network', 'getCookie', url);
      },
      set(url, keyValue, expireDate?) {
        if (!url) {
          throw new TypeError('Cookie.getAll() must have url argument');
        }

        if (typeof keyValue !== 'string') {
          throw new TypeError('Cookie.getAll() only receive string type of keyValue');
        }

        let expireStr = '';

        if (expireDate) {
          if (expireDate instanceof Date) {
            expireStr = expireDate.toUTCString();
          } else {
            throw new TypeError('Cookie.getAll() only receive Date type of expires');
          }
        }

        callNative.call(this, 'network', 'setCookie', url, keyValue, expireStr);
      }
    };
  } catch (e) {}
};

export const setCookie = (cookieItem: CookieItem) => {
  const Cookie = getCookieAPI();
  if (!Cookie) {
    return;
  }
  const { name, url, value} = cookieItem;
  Cookie.set(url, `${name}=${value}`);
}

export const hookFetch = once(() => {
  hookFunction(global, 'fetch', {
    isAsync: true,
    before: function(ctx, url, options) {
      ctx.id = createId();
      const reqHeaders = options?.headers || {};
      const method = options?.method || 'GET';
      const data = isStr(options?.body) ? options?.body : '';
      ctx.reqHeaders = reqHeaders;

      const protocol: CMD = ['Network.requestWillBeSent', {
        requestId: ctx.id,
        type: 'Fetch',
        request: {
          method,
          url,
          headers: reqHeaders,
          postData: data,
        },
        timestamp: now() / 1000,
      }];

      triggerOrPushQueue(protocol);
    },
    after: function(ctx, res, url, options) {
      const { id } = ctx;
      const { status, headers } = res;
      const mimeType = getType(headers['Content-Type'] || headers['content-type']).subType;
      res.text().then((resTxt: string) => {
        resTxtMap.set(id, resTxt);
        const receiveProtocol: CMD = ['Network.responseReceived', {
          requestId: id,
          type: 'Fetch',
          response: {
            url,
            status,
            headers,
            mimeType
          },
          timestamp: now() / 1000,
        }];
        const finishProtocol: CMD = ['Network.loadingFinished', {
          requestId: id,
          encodedDataLength: getFetchSize(res, resTxt),
          timestamp: now() / 1000,
        }];

        triggerOrPushQueue(receiveProtocol);
        triggerOrPushQueue(finishProtocol);
      });
    },
    error: function(ctx, e, url) {
      // const {id} = ctx;
      // const receiveProtocol: CMD = ['Network.responseReceived', {
      //   requestId: id,
      //   type: 'Fetch',
      //   response: {
      //     url,
      //     status: e.code,
      //     statusText: e.message,
      //   },
      //   timestamp: now() / 1000,
      // }];
      const finishProtocol: CMD = ['Network.loadingFailed', {
        requestId: ctx.id,
        type: 'Fetch',
        timestamp: now() / 1000,
        errorText: e.code,
      }];
      // triggerOrPushQueue(receiveProtocol);
      triggerOrPushQueue(finishProtocol);
    }
  });
})

/**
 * hook callNative('http', 'request', args)
 * 此方法目前只在手Q中使用，由 native 层提供
 */
export const hookHttpRequest = once(() => {
  // @ts-ignore
  const originCallNative = global.Hippy.bridge.callNative;
  const httpRequest = createHttpRequest(originCallNative);
  // @ts-ignore
    if(global?.Hippy?.bridge?.callNative) {
      // @ts-ignore
      global.Hippy.bridge.callNative = callNative;
    }

    function callNative (module, method, ...args) {
      switch (`${module}:${method}`) {
        case 'http:request':
          // @ts-ignore
          return httpRequest(...args);
      }
      return originCallNative(module, method, ...args);
    };
})

// @ts-ignore
function createHttpRequest(callNative) {
  return (options, callback) => {
    const id = createId();
    const reqHeaders = options?.headers || {};
    const method = options?.method || 'GET';
    const url = options.url;
    const data = JSON.stringify(options.data || {});

    const protocol: CMD = ['Network.requestWillBeSent', {
      requestId: id,
      type: 'Fetch',
      request: {
        method,
        url,
        headers: reqHeaders,
        postData: data,
      },
      timestamp: now() / 1000,
    }];

    triggerOrPushQueue(protocol);

    return callNative('http', 'request', options, (result) => {
      const resTxt = JSON.stringify(result.data || {});
      resTxtMap.set(id, resTxt);
      const receiveProtocol: CMD = ['Network.responseReceived', {
        requestId: id,
        type: 'Fetch',
        response: {
          url,
          status: result.code,
          // 获取不到响应头
          headers: result.headers || {},
        },
        timestamp: now() / 1000,
      }];
      const finishProtocol: CMD = ['Network.loadingFinished', {
        requestId: id,
        encodedDataLength: getFetchSize(result, resTxt),
        timestamp: now() / 1000,
      }];

      triggerOrPushQueue(receiveProtocol);
      triggerOrPushQueue(finishProtocol);

      callback(result);
    });
  };
}

export const hookWebSocket = once(() => {
  hookClass(WebSocket, {
    send: {
      // could not use arrow function, because can't bind this for arrow function
      before: function(...args) {
        if ((this as any).ignoreMonitor) return;
        triggerOrPushQueue(['Network.webSocketFrameSent', {
          requestId: (this as any).requestId,
          timestamp: Date.now() / 1000,
          response: {
            opcode: 1,
            mask: false,
            payloadData: args[0],
          }
        }])
      },
    },
    close: {
      before: function() {
        if ((this as any).ignoreMonitor) return;

        triggerOrPushQueue(['Network.webSocketClosed', {
          requestId: (this as any).requestId,
          timestamp: Date.now() / 1000,
        }])
      },
    },
    onmessage: {
      argsBefore: function(fn) {
        return new Proxy(fn, {
          apply: (target, thisArg, args) => {
            const result = target.apply(thisArg, args);
            if(!(this as any).ignoreMonitor) {
              let payloadData
              if(typeof args[0] === 'object') {
                payloadData = JSON.stringify(args[0]);
              } else {
                payloadData = args[0].toString();
              }
              triggerOrPushQueue(['Network.webSocketFrameReceived', {
                requestId: (this as any).requestId,
                timestamp: Date.now() / 1000,
                response: {
                  opcode: 1,
                  mask: false,
                  payloadData,
                }
              }])
            }
            return result;
          },
        });
      },
    },
    onWebSocketEvent: {
      current: function(...args) {
        /**
         * lazy load of native module by getter will cause to event loop confused.
         * `ws.onWebSocketEvent` is ahead of `Bridge.callNativeWithPromise(WEB_SOCKET_MODULE_NAME, 'connect', params).then()`
         * so make some delay here
         */
        setTimeout(() => {
          this._onWebSocketEvent(...args);
        }, 100);
      }
    },
    onopen: {
      argsBefore: function(fn) {
        return new Proxy(fn, {
          apply: (target, thisArg, args) => {
            const result = target.apply(thisArg, args);
            if (!(this as any).ignoreMonitor) {
              triggerOrPushQueue(['Network.webSocketHandshakeResponseReceived', {
                requestId: (this as any).requestId,
                timestamp: Date.now() / 1000,
                response: {
                  status: 101,
                  headers: {},
                }
              }]);
            }
            return result;
          },
        });
      },
    },
    onclose: {
      argsBefore: function(fn) {
        return new Proxy(fn, {
          apply: (target, thisArg, args) => {
            const result = target.apply(thisArg, args);
            if (!(this as any).ignoreMonitor) {
              triggerOrPushQueue(['Network.webSocketClosed', {
                requestId: (this as any).requestId,
                timestamp: Date.now() / 1000,
              }]);
            }
            return result;
          },
        });
      },
    },
  });

  global.WebSocket = new Proxy<ExtendedWebSocket>(WebSocket as ExtendedWebSocket, {
    construct(Target: ExtendedWebSocket, args: unknown[]) {
      // @ts-ignore
      const instance = new Target(...args);
      // @ts-ignore
      instance.ignoreMonitor = false;
      if(args.length === 4) {
        // @ts-ignore
        instance.ignoreMonitor = args[3] as boolean;
      }
      const constructHook = (...args) => {
        // @ts-ignore
        if (!instance.ignoreMonitor) {
          const [, protocols, extrasHeaders] = args;
          const headers = extrasHeaders || {};
          if (Array.isArray(protocols) && protocols.length > 0) {
            headers['Sec-WebSocket-Protocol'] = protocols.join(',');
          } else if (typeof protocols === 'string') {
            headers['Sec-WebSocket-Protocol'] = protocols;
          }

          (instance as any).requestId = createId();
          const ts = Date.now();

          triggerOrPushQueue(['Network.webSocketCreated', {
            requestId: (instance as any).requestId,
            url: (instance as any).url,
          }]);
          triggerOrPushQueue(['Network.webSocketWillSendHandshakeRequest', {
            requestId: (instance as any).requestId,
            timestamp: ts / 1000,
            wallTime: ts / 1000,
            request: {
              headers,
            }
          }])
        }
      }
      constructHook.apply(instance, args)
      return instance;
    }
  }) as ExtendedWebSocket;
})

const parseCookie = (cookieStr: string, origin: string): CookieItem[] => {
  const cookies = [];
  if (!cookieStr) {
    return cookies;
  }
  if (trim(cookieStr) !== '') {
    each(cookieStr.split(';'), function (value: any) {
      value = value.split('=');
      const name = trim(value.shift());
      value = decodeUriComponent(value.join('='));
      cookies.push({
        name,
        value,
        path: '/',
        secure: origin.startsWith('https'),
        session: false,
        // expires: -1,
        // httpOnly: false,
        // priority: 'Medium',
        // sourceScheme: 'Secure',
        domain: origin.replace(/^https?\:\/\//, ''),
      });
    });
  }
  return cookies;
}

interface CookieItem {
  name: string;
  value: string;
  url?: string;
  domain?: string;
  httpOnly?: boolean;
  path?: string;
  priority?: string;
  sameParty?: boolean;
  secure?: boolean;
}

type ExtendedWebSocket = typeof WebSocket & {
  ignoreMonitor?: boolean;
}

function triggerOrPushQueue(cmd: CMD) {
  if(isEnabled) {
    connector.trigger(...cmd);
  } else {
    cmdQueue.push(cmd);
  }
}
