import { ClientRole } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { config } from '@/config';
import { DebugTarget } from '@/@types/debug-target';

const log = new Logger('url-utils');

export type AppWsUrlParams = {
  clientId: string;
  clientRole: ClientRole;
  pathname: string;
  contextName?: string;
  deviceName?: string;
};

export type DevtoolsWsUrlParams = {
  clientId: string;
  pathname: string;
  clientRole: ClientRole;
  extensionName: string;
  contextName?: string;
};

export type WsUrlParams = AppWsUrlParams | DevtoolsWsUrlParams;

/**
 * 解析 ws 连接的 url 参数
 */
export const parseWsUrl = (reqUrl: string): WsUrlParams => {
  const url = new URL(reqUrl, 'http://0.0.0.0');
  const clientId = url.searchParams.get('clientId');
  const contextName = url.searchParams.get('contextName');
  const clientRole = url.searchParams.get('role') as ClientRole;
  const deviceName = url.searchParams.get('deviceName');
  const extensionName = url.searchParams.get('extensionName') || '';
  return {
    clientId,
    clientRole,
    pathname: url.pathname,
    contextName,
    deviceName,
    extensionName,
  };
};

/**
 * 根据 ws url 参数判断连接是否合法，如果是 devtools 来源的 ws 连接，必须存在调试对象
 */
export const isConnectionValid = (wsUrlParams: WsUrlParams, debugTarget: DebugTarget): boolean => {
  const { clientRole, pathname, contextName } = wsUrlParams;
  const { clientId } = wsUrlParams;
  log.info('clientRole: %s', clientRole);
  if (clientRole === ClientRole.Devtools) log.info('isConnectionValid debug target: %j', debugTarget);

  if (pathname !== config.wsPath) {
    log.warn('invalid ws connection path!');
    return false;
  }
  if (clientRole === ClientRole.Devtools && !debugTarget) {
    log.warn('debugTarget not exist! %s', clientId);
    return false;
  }
  if (!Object.values(ClientRole).includes(clientRole)) {
    log.warn('invalid client role!');
    return false;
  }
  if (clientRole === ClientRole.IOS && !contextName) {
    log.warn('invalid iOS connection, should request with contextName!');
    return false;
  }

  if (!clientId) {
    log.warn('invalid ws connection!');
    return false;
  }
  return true;
};

/**
 * 根据 query 对象创建 url
 */
export const makeUrl = (baseUrl: string, query: unknown) => {
  let fullUrl = baseUrl;

  const keys = Object.keys(query);
  for (const [i, key] of keys.entries()) {
    if (i === 0) {
      if (fullUrl.indexOf('?') === -1) {
        fullUrl += '?';
      }
    } else {
      fullUrl += '&';
    }
    fullUrl += `${key}=${encodeURIComponent(query[key])}`;
  }
  return fullUrl;
};
