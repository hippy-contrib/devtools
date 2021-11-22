import request from 'request-promise';
import { v4 as uuidv4 } from 'uuid';
import { AppClientType, DevicePlatform, ClientRole } from '@/@types/enum';
import { config } from '@/config';
import { Logger } from '@/utils/log';
import { makeUrl } from '@/utils/url';
import { model } from '@/db';
import { DebugTarget } from '@/@types/debug-target';

const log = new Logger('debug-targets-controller');

export class DebugTargetManager {
  public static debugTargets: DebugTarget[] = [];

  public static getDebugTargets = async (): Promise<DebugTarget[]> => {
    const { iwdpPort } = global.appArgv;
    const [targets, iosPages] = await Promise.all([getTargetsByDB(), getIWDPPages({ iwdpPort })]);
    const iosTargets = [];
    targets.forEach((target) => {
      const pages = iosPages.filter(
        (iosPage) =>
          (target.appClientTypeList[0] === AppClientType.WS && target.title === iosPage.title) ||
          (target.appClientTypeList[0] === AppClientType.Tunnel && target.deviceName === iosPage.device.deviceName),
      );
      if (pages.length) {
        (target as any).shouldRemove = true;
        iosTargets.push(
          ...pages.map((iosPage) => {
            const matchRst = iosPage.title.match(/^HippyContext:\s(.*)$/);
            const bundleName = matchRst ? matchRst[1] : '';
            const iwdpWsUrl = iosPage.webSocketDebuggerUrl;
            const devtoolsId = uuidv4();
            const wsUrl = makeUrl(`${config.domain}${config.wsPath}`, {
              platform: DevicePlatform.IOS,
              iwdpWsUrl,
              devtoolsId,
              role: ClientRole.Devtools,
            });
            const devtoolsFrontendUrl = makeUrl(`http://${config.domain}/front_end/inspector.html`, {
              remoteFrontend: true,
              experiments: true,
              ws: wsUrl,
              env: global.appArgv.env,
            });
            return {
              ...target,
              device: iosPage.device,
              title: iosPage.title,
              bundleName,
              devtoolsFrontendUrl,
              devtoolsFrontendUrlCompat: devtoolsFrontendUrl,
              webSocketDebuggerUrl: `ws://${wsUrl}`,
            };
          }),
        );
      }
    });
    DebugTargetManager.debugTargets = targets.filter((target) => !(target as any).shouldRemove).concat(iosTargets);
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
