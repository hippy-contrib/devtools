import { v4 as uuidv4 } from 'uuid';
import { DeviceInfo, DebugTarget } from '@/@types/tunnel';
import { ChromePageType, DevicePlatform, ClientRole, AppClientType } from '@/@types/enum';
import { makeUrl, WsUrlParams } from '@/utils/url';
import { config } from '@/config';

export const createTargetByTunnel = (device: DeviceInfo): DebugTarget => {
  const clientId = uuidv4();
  // 通过 tunnel 创建的 target，暂时使用 devicename 作为调试对象id，后续终端重构后使用 targetCreated 事件抛出的 id
  const targetId = device.devicename;
  const wsUrl = makeUrl(`${config.domain}${config.wsPath}`, {
    platform: device.platform,
    clientId,
    targetId,
    role: ClientRole.Devtools,
  });
  const devtoolsFrontendUrl = makeUrl(`http://${config.domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    ws: wsUrl,
    env: config.env,
  });
  const title = device.platform === DevicePlatform.IOS ? targetId : 'Hippy debug tools for V8';

  return {
    id: targetId,
    clientId,
    devtoolsFrontendUrl,
    devtoolsFrontendUrlCompat: devtoolsFrontendUrl,
    thumbnailUrl: '',
    title,
    url: '',
    description: '',
    webSocketDebuggerUrl: `ws://${wsUrl}`,
    platform: device.platform,
    type: ChromePageType.Page,
    deviceName: device.devicename,
    appClientTypeList: [AppClientType.Tunnel],
    device: {
      deviceId: device.deviceid,
      deviceName: device.devicename,
      deviceOSVersion: device.osVersion,
      url: '',
    },
  };
};

export const createTargetByWs = (wsUrlParams: WsUrlParams): DebugTarget => {
  const { clientId, platform, contextName, deviceName } = wsUrlParams;
  const uuid = uuidv4();
  const wsUrl = makeUrl(`${config.domain}${config.wsPath}`, {
    platform,
    clientId: uuid,
    targetId: clientId,
    role: ClientRole.Devtools,
  });
  const devtoolsFrontendUrl = makeUrl(`http://${config.domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    ws: wsUrl,
    env: config.env,
  });
  return {
    id: clientId,
    clientId: uuid,
    devtoolsFrontendUrl,
    devtoolsFrontendUrlCompat: devtoolsFrontendUrl,
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
