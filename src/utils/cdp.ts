import { EventEmitter } from 'events';
import { ChromeCommand } from 'tdf-devtools-protocol/dist/types';
import { uniq } from 'lodash';

export const CDP_DOMAIN_LIST = uniq(
  (Object.values(ChromeCommand) as string[]).map((command: string) => command.split('.')[0]),
);

export const isCdpDomains = (domain) => CDP_DOMAIN_LIST.indexOf(domain) !== -1;

export const getDomain = (method: string) => {
  let domain = method;
  const group = method.match(/^(\w+)(\.\w+)?$/);
  if (group) {
    [, domain] = group;
  }
  return domain;
};

export class DomainRegister extends EventEmitter {
  private domainListeners: Map<string, Adapter.DomainListener[]> = new Map();

  public registerDomainListener: Adapter.RegisterDomainListener = (domain, listener) => {
    if (!this.domainListeners.has(domain)) this.domainListeners.set(domain, []);
    this.domainListeners.get(domain).push(listener);
  };

  protected triggerListerner(msg: Adapter.CDP.Res) {
    if (this.domainListeners.has(msg.method)) {
      this.domainListeners.get(msg.method).forEach((listener) => {
        listener(msg);
      });
    }
  }
}
