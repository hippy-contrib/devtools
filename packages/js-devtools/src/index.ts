import connector from './lib/connector';
import { createBridge } from './lib/bridge';
import noop from 'licia/noop';
import uuid from 'licia/uuid';
import methods from './domains/methods';
import each from 'licia/each';
import Emitter from 'licia/Emitter';
import { hookFetch, hookHttpRequest } from './domains/Network';
import { hookConsole } from './domains/Runtime';
import { hookLocalStorage } from './domains/DOMStorage';
import { parseURL } from './lib/url';
import { setDomains } from './lib/domain';
import { log } from './lib/log';
// @ts-ignore
// import { Vue, NetworkModule } from './lib/external';

type OnMessage = (message: string) => void;
type DomainMethod = (...args: any[]) => any;

class Chobitsu {
  private onMessage: OnMessage;
  private resolves: Map<string, (value?: any) => void> = new Map();
  private domains: Map<string, { [index: string]: DomainMethod }> = new Map();
  constructor() {
    this.onMessage = noop;
    connector.on('message', message => {
      const parsedMessage = JSON.parse(message);

      const resolve = this.resolves.get(parsedMessage.id);
      if (resolve) {
        resolve(parsedMessage.result);
      }

      if (!parsedMessage.id) {
        const [name, method] = parsedMessage.method.split('.');
        const domain = this.domains.get(name);
        if (domain) {
          domain.emit(method, parsedMessage.params);
        }
      }

      this.onMessage(message);
    });

    this.initDomains();
  }
  domain(name: string) {
    return this.domains.get(name);
  }
  setOnMessage(onMessage: OnMessage) {
    this.onMessage = onMessage;
  }
  sendMessage(method: string, params: any = {}) {
    const id = uuid();

    this.sendRawMessage(
      JSON.stringify({
        id,
        method,
        params,
      })
    );

    return new Promise(resolve => {
      this.resolves.set(id, resolve);
    });
  }
  async sendRawMessage(message: string) {
    const parsedMessage = JSON.parse(message);

    const { method, params, id } = parsedMessage;

    const resultMsg: any = {
      id,
    };

    try {
      resultMsg.result = await this.callMethod(method, params);
    } catch (e) {
      resultMsg.error = {
        message: (e as Error).message,
      };
    }

    connector.emit('message', JSON.stringify(resultMsg));
  }
  private initDomains() {
    const domains = this.domains;

    each(methods, (fn: any, key: string) => {
      const [name, method] = key.split('.');
      let domain = domains.get(name);
      if (!domain) {
        domain = {};
        Emitter.mixin(domain);
      }
      domain[method] = fn;
      domains.set(name, domain);
    });
  }
  private async callMethod(method: string, params: any) {
    if (methods[method]) {
      return methods[method](params) || {};
    } else {
      throw Error(`${method} unimplemented`);
    }
  }
}

let { domains } = parseURL(__resourceQuery) as any;
try {
  domains = JSON.parse(domains);
} catch(e) {
  domains = []
}
setDomains(domains);

const startVanillaJSDebug = () => {
  log.info('enable inspect Network, Cookie, Storage');

  let isInit = false;
  const chobitsu = new Chobitsu();
  const ws = createBridge({
    onOpen: () => {
      isInit = true;
    },
    onClose: () => {
      isInit = false;
    },
    onMessage: (event) => {
      chobitsu.sendRawMessage(event.data);
    }
  });
  chobitsu.setOnMessage((message: string) => {
    if(!isInit) return;
    ws.send(message);
  })
};

// @ts-ignore
if(global?.Hippy?.device?.platform?.OS === 'ios') hookConsole();
// hookWebSocket();
hookFetch();
hookHttpRequest();
hookLocalStorage();

// because Vue getApp could not resolve before `new Hippy` is called, delay here
setTimeout(() => {
  startVanillaJSDebug();
}, 2000);
