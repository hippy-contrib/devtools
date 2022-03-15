import { DeviceInfo } from '@/@types/device';
import { ChromePageType, DevicePlatform, ClientRole, AppClientType } from '@/@types/enum';
import { makeUrl, AppWsUrlParams } from '@/utils/url';
import { config } from '@/config';
import { DebugTarget } from '@/@types/debug-target';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';
import { getDBOperator } from '@/db';
import { Logger } from '@/utils/log';

const log = new Logger('debug-target-util');

/**
 * 通过 device 信息创建调试对象
 */
export const createTargetByDeviceInfo = (device: DeviceInfo): DebugTarget => {
  // 通过 tunnel 创建的 target，暂时使用 devicename 作为调试对象 id，后续终端重构后使用 targetCreated 事件抛出的 id
  const clientId = device.devicename;
  const wsUrl = makeUrl(`${config.wsDomain}${config.wsPath}`, {
    clientId,
    role: ClientRole.Devtools,
  });
  const devtoolsFrontendUrl = makeUrl(`${config.domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    [config.wsProtocol]: wsUrlWithoutProtocol(wsUrl),
    env: global.debugAppArgv.env,
  });
  const title = device.platform === DevicePlatform.IOS ? clientId : 'Hippy debug tools for V8';

  return {
    clientId,
    devtoolsFrontendUrl,
    thumbnailUrl: '',
    title,
    url: '',
    description: '',
    webSocketDebuggerUrl: wsUrl,
    platform: device.platform,
    type: ChromePageType.Page,
    appClientTypeList: [AppClientType.Tunnel],
    deviceId: device.deviceid,
    deviceName: device.devicename,
    deviceOSVersion: device.osVersion,
    ref: 1,
    ts: Date.now(),
  };
};

/**
 * 通过 ws 连接 url 创建调试对象
 */
export const createTargetByWsUrlParams = (wsUrlParams: AppWsUrlParams, host?: string): DebugTarget => {
  const { clientId, clientRole, contextName, deviceName, hash } = wsUrlParams;
  // if node server is in remote cluster
  // domain maybe devtools.qq.com or tdf-devtools.woa.com
  // so get domain from host
  const domain = config.isCluster ? `https://${host}` : config.domain;
  const wsDomain = domain.replace('https://', 'wss://').replace('http://', 'ws://');
  let platform;
  if (clientRole === ClientRole.Android) platform = DevicePlatform.Android;
  if (clientRole === ClientRole.IOS) platform = DevicePlatform.IOS;
  const wsUrl = makeUrl(`${wsDomain}${config.wsPath}`, {
    clientId,
    role: ClientRole.Devtools,
    hash,
  });
  const devtoolsFrontendUrl = makeUrl(`${domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    [config.wsProtocol]: wsUrlWithoutProtocol(wsUrl),
    env: global.debugAppArgv.env,
    hash,
  });
  return {
    hash,
    clientId,
    devtoolsFrontendUrl,
    thumbnailUrl: '',
    title: contextName,
    url: '',
    description: '',
    webSocketDebuggerUrl: wsUrl,
    platform,
    type: ChromePageType.Page,
    deviceName,
    appClientTypeList: [AppClientType.WS],
    ref: 1,
    ts: Date.now(),
  };
};

/**
 * 通过 IWDP 获取到的页面创建调试对象
 */
export const createTargetByIWDPPage = (iWDPPage: IWDPPage): DebugTarget => {
  const iWDPWsUrl = iWDPPage.webSocketDebuggerUrl;
  const wsUrl = makeUrl(`${config.wsDomain}${config.wsPath}`, {
    clientId: iWDPWsUrl,
    role: ClientRole.Devtools,
  });
  const devtoolsFrontendUrl = makeUrl(`${config.domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    [config.wsProtocol]: wsUrlWithoutProtocol(wsUrl),
    env: global.debugAppArgv.env,
  });
  return {
    clientId: iWDPWsUrl,
    iWDPWsUrl,
    devtoolsFrontendUrl,
    title: iWDPPage.title,
    thumbnailUrl: '',
    url: '',
    description: '',
    webSocketDebuggerUrl: wsUrl,
    platform: DevicePlatform.IOS,
    type: ChromePageType.Page,
    deviceId: iWDPPage.device.deviceId,
    deviceName: iWDPPage.device.deviceName,
    deviceOSVersion: iWDPPage.device.deviceOSVersion,
    appClientTypeList: [AppClientType.IWDP],
    ref: 1,
    ts: Date.now(),
  };
};

/**
 * 补充完整 debugTarget 信息。
 * 当 iOS 根据 device 创建出调试对象时，用 IWDP 获取到的额外信息加以补充
 */
export const patchDebugTarget = async (debugTarget: DebugTarget) => {
  if (debugTarget.platform === DevicePlatform.IOS) {
    const iOSPages = await getIWDPPages(global.debugAppArgv.iWDPPort);
    return patchIOSTarget(debugTarget, iOSPages);
  }
  return debugTarget;
};

export function wsUrlWithoutProtocol(wsUrl) {
  return wsUrl.replace('wss://', '').replace('ws://', '');
}

export const patchRefAndSave = async (newDebugTarget: DebugTarget): Promise<DebugTarget> => {
  const { DB } = getDBOperator();
  const { clientId } = newDebugTarget;
  const db = new DB<DebugTarget>(config.redis.debugTargetTable);
  const oldDebugTarget = await db.get(clientId);
  const debugTarget = newDebugTarget;
  if (oldDebugTarget) {
    debugTarget.ref = oldDebugTarget.ref + 1;
    log.info('increase debugTarget ref, clientId: %s, ref: %s', clientId, debugTarget.ref);
  }
  const patched = await patchDebugTarget(debugTarget);
  await db.upsert(clientId, patched);
  return patched;
};

export const decreaseRefAndSave = async (clientId: string): Promise<DebugTarget> => {
  const { DB } = getDBOperator();
  const db = new DB<DebugTarget>(config.redis.debugTargetTable);
  const debugTarget = await db.get(clientId);
  if (!debugTarget) return;
  debugTarget.ref -= 1;
  log.info('decrease debugTarget ref, clientId: %s, ref: %s', clientId, debugTarget.ref);
  if (debugTarget.ref <= 0) {
    db.delete(clientId);
    log.info('debugTarget ref is 0, should delete, clientId: %s', clientId);
    return;
  }
  await db.upsert(clientId, debugTarget);
  return debugTarget;
};

export const removeDebugTarget = async (clientId: string) => {
  const { DB } = getDBOperator();
  const db = new DB<DebugTarget>(config.redis.debugTargetTable);
  return db.delete(clientId);
};
