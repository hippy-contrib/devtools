import request from 'request-promise';
import { AppClientType, ClientRole } from '@/@types/enum';
import { config } from '@/config';
import { Logger } from '@/utils/log';
import { makeUrl } from '@/utils/url';
import { model } from '@/db';
import { createTargetByIwdpPage } from '@/db/debug-target';
import { DebugTarget } from '@/@types/debug-target';

const log = new Logger('debug-targets-controller');

export class DebugTargetManager {
  public static debugTargets: DebugTarget[] = [];

  public static getDebugTargets = async (): Promise<DebugTarget[]> => {
    const { iwdpPort } = global.appArgv;
    const [targets, iosPages] = await Promise.all([getTargetsByDB(), getIWDPPages({ iwdpPort })]);
    const iosPagesWithFlag = iosPages as Array<IWDPPage & { shouldRemove?: boolean }>;
    // 用 IWDP 获取的额外信息扩展 targets
    targets.forEach((target, i) => {
      const iosPage = iosPagesWithFlag.find(
        (iosPage) =>
          (target.appClientTypeList[0] === AppClientType.WS && target.title === iosPage.title) ||
          (target.appClientTypeList[0] === AppClientType.Tunnel && target.deviceName === iosPage.device.deviceName),
      );
      if (iosPage) {
        iosPage.shouldRemove = true;
        // const matchRst = iosPage.title.match(/^HippyContext:\s(.*)$/);
        // const bundleName = matchRst ? matchRst[1] : '';
        const iwdpWsUrl = iosPage.webSocketDebuggerUrl;
        const wsUrl = makeUrl(`${config.domain}${config.wsPath}`, {
          // iwdpWsUrl,
          clientId: target.clientId,
          role: ClientRole.Devtools,
        });
        const devtoolsFrontendUrl = makeUrl(`http://${config.domain}/front_end/inspector.html`, {
          remoteFrontend: true,
          experiments: true,
          ws: wsUrl,
          env: global.appArgv.env,
        });
        targets[i] = {
          ...target,
          iwdpWsUrl,
          deviceName: iosPage.device.deviceName,
          deviceId: iosPage.device.deviceId,
          deviceOSVersion: iosPage.device.deviceOSVersion,
          title: iosPage.title,
          devtoolsFrontendUrl,
          devtoolsFrontendUrlCompat: devtoolsFrontendUrl,
          webSocketDebuggerUrl: `ws://${wsUrl}`,
        };
      }
    });
    // 追加 IWDP 获取到的纯 h5 页面
    const h5Pages = iosPagesWithFlag.filter((iosPage) => !iosPage.shouldRemove);
    DebugTargetManager.debugTargets = targets.concat(h5Pages.map(createTargetByIwdpPage));
    return DebugTargetManager.debugTargets;
  };

  public static async findDebugTarget(clientId: string) {
    const debugTargets = await DebugTargetManager.getDebugTargets();
    return debugTargets.find((target) => target.clientId === clientId);
  }
}

const getIWDPPages = async ({ iwdpPort }): Promise<IWDPPage[]> => {
  try {
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
    log.error(e);
    return [];
  }
};

const getTargetsByDB = async (): Promise<Array<DebugTarget>> => await model.getAll(config.redis.key);
