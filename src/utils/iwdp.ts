/**
 * 缩写说明：
 *  IWDP: ios webkit debug proxy
 *  CDP: chrome debug protocol
 */
import request from 'request-promise';
import { AppClientType, ClientRole, DevicePlatform } from '@/@types/enum';
import { config } from '@/config';
import { makeUrl } from '@/utils/url';
import { Logger } from '@/utils/log';
import { sleep } from '@/utils/timer';
import { DebugTarget } from '@/@types/debug-target';

const log = new Logger('IWDP-util');

/**
 * 获取所有 usb 连接设备的 IWDP 页面列表
 */
export const getIWDPPages = async (iWDPPort): Promise<IWDPPage[]> => {
  if (global.debugAppArgv.isRemote) return [];
  try {
    // IWDP 检查页面列表会稍有延迟，这里简单做下 sleep
    await sleep(250);
    const deviceList = await request({
      url: '/json',
      // IWDP 必定是本地启动的服务，因为必须通过 USB 连接才能检测到设备
      baseUrl: `http://127.0.0.1:${iWDPPort}`,
      json: true,
    });
    const debugTargets: IWDPPage[] = (await Promise.all(deviceList.map(getDeviceIWDPPages))) || [];
    return debugTargets.flat();
  } catch (e) {
    log.warn('request IWDP pages error');
    return [];
  }
};

/**
 * 用 IWDP 获取到的页面信息扩展 debugTarget
 */
export const patchIOSTarget = (debugTarget: DebugTarget, iOSPages: Array<IWDPPage>): DebugTarget => {
  if (debugTarget.platform !== DevicePlatform.IOS) return debugTarget;

  const iOSPagesWithFlag = iOSPages as Array<IWDPPage & { shouldRemove?: boolean }>;
  const iOSPage = iOSPagesWithFlag.find(
    (iOSPage) =>
      (debugTarget.appClientTypeList[0] === AppClientType.WS && debugTarget.title === iOSPage.title) ||
      (debugTarget.appClientTypeList[0] === AppClientType.Tunnel &&
        debugTarget.deviceName === iOSPage.device.deviceName),
  );
  if (!iOSPage) return debugTarget;

  iOSPage.shouldRemove = true;
  const iWDPWsUrl = iOSPage.webSocketDebuggerUrl;
  const wsUrl = makeUrl(`${config.domain}${config.wsPath}`, {
    clientId: debugTarget.clientId,
    role: ClientRole.Devtools,
  });
  const devtoolsFrontendUrl = makeUrl(`http://${config.domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    ws: wsUrl,
    env: global.debugAppArgv.env,
  });
  const { appClientTypeList } = debugTarget;
  if (appClientTypeList.indexOf(AppClientType.IWDP) === -1) appClientTypeList.push(AppClientType.IWDP);
  return {
    ...debugTarget,
    iWDPWsUrl,
    appClientTypeList,
    deviceName: iOSPage.device.deviceName,
    deviceId: iOSPage.device.deviceId,
    deviceOSVersion: iOSPage.device.deviceOSVersion,
    title: iOSPage.title,
    devtoolsFrontendUrl,
    webSocketDebuggerUrl: `ws://${wsUrl}`,
  };
};

/**
 * 获取一台设备的 IWDP 页面列表
 */
const getDeviceIWDPPages = async (device: IWDPDevice): Promise<IWDPPage[]> => {
  const port = device.url.match(/:(\d+)/)[1];
  try {
    const targets: IWDPPage[] = await request({
      url: '/json',
      baseUrl: `http://127.0.0.1:${port}`,
      json: true,
    });
    targets.forEach((target) => (target.device = device));
    return targets;
  } catch (e) {
    log.error('getDeviceIWDPPages error, %s', (e as Error)?.stack);
    return [];
  }
};
