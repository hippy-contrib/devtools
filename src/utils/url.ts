import { trim } from 'lodash';
import { ClientRole, WinstonColor } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { config } from '@/config';

const log = new Logger('url-utils', WinstonColor.Gray);

export type AppWsUrlParams = {
  clientId: string;
  clientRole: ClientRole;
  pathname: string;
  contextName?: string;
  deviceName?: string;
  // when use remote debug, we use this field for auth, you can only find and debug
  // pages with this version id
  hash?: string;
};

export type DevtoolsWsUrlParams = {
  clientId: string;
  pathname: string;
  clientRole: ClientRole;
  extensionName: string;
  contextName?: string;
  hash?: string;
};

export type HMRWsParams = {
  hash: string;
  pathname: string;
  clientRole: ClientRole;
};

export type WsUrlParams = AppWsUrlParams | DevtoolsWsUrlParams | HMRWsParams;

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
  const hash = url.searchParams.get('hash') || '';
  return {
    clientId,
    clientRole,
    pathname: url.pathname,
    contextName,
    deviceName,
    extensionName,
    hash,
  };
};

/**
 * 根据 ws url 参数判断连接是否合法
 *  - 如果是 devtools 来源的 ws 连接，必须存在调试对象
 *  - 如果是 HMR 来源的 ws 连接，必须有 hash 字段
 */
export const getWsInvalidReason = (wsUrlParams: WsUrlParams): string => {
  const { clientRole, pathname } = wsUrlParams;
  log.info('clientRole: %s', clientRole);

  if (pathname !== config.wsPath) return 'invalid ws connection path!';
  if (!Object.values(ClientRole).includes(clientRole)) return 'invalid client role!';

  if (clientRole === ClientRole.HMRClient || clientRole === ClientRole.HMRServer) {
    if ('hash' in wsUrlParams) return '';
    return 'invalid HMR ws params, must connect with hash field!';
  }

  const { clientId, contextName } = wsUrlParams as AppWsUrlParams | DevtoolsWsUrlParams;
  // if (clientRole === ClientRole.Devtools && !('hash' in wsUrlParams) && config.isCluster)
  //   return 'invalid ws connection, you ws url should carry `hash` query params!';
  if (clientRole === ClientRole.IOS && !contextName) return 'invalid iOS connection, should request with contextName!';
  if (!clientId) return 'invalid ws connection!';
  return '';
};

/**
 * 根据 query 对象创建 url
 */
export const makeUrl = (baseUrl: string, query: unknown = {}) => {
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

export const getWSProtocolByHttpProtocol = (httpProtocol: string) =>
  ({
    https: 'wss',
    http: 'ws',
  }[httpProtocol] || 'ws');

export const getBaseFolderOfPublicPath = (publicPath: string) => {
  const url = new URL(publicPath, 'http://0.0.0.0');
  return trim(url.pathname, '/');
};
