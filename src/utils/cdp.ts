/**
 * CDP 缩写: chrome debug protocol
 */
import { ChromeCommand } from 'tdf-devtools-protocol/dist/types';
import { uniq } from 'lodash';

export const CDP_DOMAIN_LIST = uniq(
  (Object.values(ChromeCommand) as string[]).map((command: string) => command.split('.')[0]),
);

export const isCDPDomains = (domain) => CDP_DOMAIN_LIST.indexOf(domain) !== -1;

/**
 * 根据调试 command 获取其所属的 domain
 */
export const getDomain = (method: string) => {
  let domain = method;
  const group = method.match(/^(\w+)(\.\w+)?$/);
  if (group) {
    [, domain] = group;
  }
  return domain;
};
