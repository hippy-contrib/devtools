import request from 'request-promise';
import { AppClientType, ClientRole, DevicePlatform } from '@/@types/enum';
import { config } from '@/config';
import { makeUrl } from '@/utils/url';
import { Logger } from '@/utils/log';
import { sleep } from '@/utils/timer';
import { DebugTarget } from '@/@types/debug-target';

const log = new Logger('iwdp-util');

export const getIWDPPages = async (iwdpPort): Promise<IWDPPage[]> => {
  if (!global.appArgv.useTunnel) return [];
  try {
    // iwdp 检查页面列表会稍有延迟，这里简单做下 sleep
    await sleep(250);
    const deviceList = await request({
      url: '/json',
      baseUrl: `http://127.0.0.1:${iwdpPort}`,
      json: true,
    });
    const debugTargets: IWDPPage[] =
      (await Promise.all(
        deviceList.map(async (device) => {
          const port = device.url.match(/:(\d+)/)[1];
          try {
            const targets = await request({
              url: '/json',
              baseUrl: `http://127.0.0.1:${port}`,
              json: true,
            });
            targets.map((target) => (target.device = device));
            return targets;
          } catch (e) {
            log.error(e);
            return [];
          }
        }),
      )) || [];
    return debugTargets.flat();
  } catch (e) {
    log.error('request IWDP pages error: %s', (e as Error).stack);
    return [];
  }
};

export const patchIOSTarget = (debugTarget: DebugTarget, iosPages: Array<IWDPPage>): DebugTarget => {
  if (debugTarget.platform !== DevicePlatform.IOS) return debugTarget;

  const iosPagesWithFlag = iosPages as Array<IWDPPage & { shouldRemove?: boolean }>;
  const iosPage = iosPagesWithFlag.find(
    (iosPage) =>
      (debugTarget.appClientTypeList[0] === AppClientType.WS && debugTarget.title === iosPage.title) ||
      (debugTarget.appClientTypeList[0] === AppClientType.Tunnel &&
        debugTarget.deviceName === iosPage.device.deviceName),
  );
  if (!iosPage) return debugTarget;

  // TODO 有副作用，待优化
  iosPage.shouldRemove = true;
  // const matchRst = iosPage.title.match(/^HippyContext:\s(.*)$/);
  // const bundleName = matchRst ? matchRst[1] : '';
  const iwdpWsUrl = iosPage.webSocketDebuggerUrl;
  const wsUrl = makeUrl(`${config.domain}${config.wsPath}`, {
    clientId: debugTarget.clientId,
    role: ClientRole.Devtools,
  });
  const devtoolsFrontendUrl = makeUrl(`http://${config.domain}/front_end/inspector.html`, {
    remoteFrontend: true,
    experiments: true,
    ws: wsUrl,
    env: global.appArgv.env,
  });
  const { appClientTypeList } = debugTarget;
  if (appClientTypeList.indexOf(AppClientType.IWDP) === -1) appClientTypeList.push(AppClientType.IWDP);
  return {
    ...debugTarget,
    iwdpWsUrl,
    appClientTypeList,
    deviceName: iosPage.device.deviceName,
    deviceId: iosPage.device.deviceId,
    deviceOSVersion: iosPage.device.deviceOSVersion,
    title: iosPage.title,
    devtoolsFrontendUrl,
    webSocketDebuggerUrl: `ws://${wsUrl}`,
  };
};
