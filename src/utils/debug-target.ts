import { DeviceInfo } from '@/@types/device';
import { ChromePageType, DevicePlatform, ClientRole, AppClientType } from '@/@types/enum';
import { makeUrl, AppWsUrlParams } from '@/utils/url';
import { config } from '@/config';
import { DebugTarget } from '@/@types/debug-target';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';

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
    ws: wsUrlWithoutProtocol(wsUrl),
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
  };
};

/**
 * 通过 ws 连接 url 创建调试对象
 */
export const createTargetByWsUrlParams = (wsUrlParams: AppWsUrlParams): DebugTarget => {
  const { clientId, clientRole, contextName, deviceName, hash } = wsUrlParams;
  let platform;
  if (clientRole === ClientRole.Android) platform = DevicePlatform.Android;
  if (clientRole === ClientRole.IOS) platform = DevicePlatform.IOS;
  const wsUrl = makeUrl(`${config.wsDomain}${config.wsPath}`, {
    clientId,
    role: ClientRole.Devtools,
  });
  const devtoolsFrontendUrl = makeUrl(`${config.domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    ws: wsUrlWithoutProtocol(wsUrl),
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
    ws: wsUrlWithoutProtocol(wsUrl),
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
