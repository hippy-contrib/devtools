import { DeviceInfo } from '@/@types/device';
import { ChromePageType, DevicePlatform, ClientRole, AppClientType } from '@/@types/enum';
import { makeUrl, AppWsUrlParams } from '@/utils/url';
import { config } from '@/config';
import { DebugTarget } from '@/@types/debug-target';

export const createTargetByDeviceInfo = (device: DeviceInfo): DebugTarget => {
  // 通过 tunnel 创建的 target，暂时使用 devicename 作为调试对象id，后续终端重构后使用 targetCreated 事件抛出的 id
  const clientId = device.devicename;
  const wsUrl = makeUrl(`${config.domain}${config.wsPath}`, {
    clientId,
    role: ClientRole.Devtools,
  });
  const devtoolsFrontendUrl = makeUrl(`http://${config.domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    ws: wsUrl,
    env: global.appArgv.env,
  });
  const title = device.platform === DevicePlatform.IOS ? clientId : 'Hippy debug tools for V8';

  return {
    clientId,
    devtoolsFrontendUrl,
    thumbnailUrl: '',
    title,
    url: '',
    description: '',
    webSocketDebuggerUrl: `ws://${wsUrl}`,
    platform: device.platform,
    type: ChromePageType.Page,
    appClientTypeList: [AppClientType.Tunnel],
    deviceId: device.deviceid,
    deviceName: device.devicename,
    deviceOSVersion: device.osVersion,
  };
};

export const createTargetByWsUrlParams = (wsUrlParams: AppWsUrlParams): DebugTarget => {
  const { clientId, clientRole, contextName, deviceName } = wsUrlParams;
  let platform;
  if (clientRole === ClientRole.Android) platform = DevicePlatform.Android;
  if (clientRole === ClientRole.IOS) platform = DevicePlatform.IOS;
  const wsUrl = makeUrl(`${config.domain}${config.wsPath}`, {
    clientId,
    role: ClientRole.Devtools,
  });
  const devtoolsFrontendUrl = makeUrl(`http://${config.domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    ws: wsUrl,
    env: global.appArgv.env,
  });
  return {
    clientId,
    devtoolsFrontendUrl,
    thumbnailUrl: '',
    title: contextName,
    url: '',
    description: '',
    webSocketDebuggerUrl: `ws://${wsUrl}`,
    platform,
    type: ChromePageType.Page,
    deviceName,
    appClientTypeList: [AppClientType.WS],
  };
};

export const createTargetByIwdpPage = (iwdpPage: IWDPPage): DebugTarget => {
  const iwdpWsUrl = iwdpPage.webSocketDebuggerUrl;
  const wsUrl = makeUrl(`${config.domain}${config.wsPath}`, {
    clientId: iwdpWsUrl,
    role: ClientRole.Devtools,
  });
  return {
    clientId: iwdpWsUrl,
    iwdpWsUrl,
    devtoolsFrontendUrl: iwdpPage.devtoolsFrontendUrl,
    title: iwdpPage.title,
    thumbnailUrl: '',
    url: '',
    description: '',
    webSocketDebuggerUrl: `ws://${wsUrl}`,
    platform: DevicePlatform.IOS,
    type: ChromePageType.Page,
    deviceId: iwdpPage.device.deviceId,
    deviceName: iwdpPage.device.deviceName,
    deviceOSVersion: iwdpPage.device.deviceOSVersion,
    appClientTypeList: [AppClientType.IWDP],
  };
};
