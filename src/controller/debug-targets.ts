import { config } from '@/config';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';
import { createTargetByIWDPPage } from '@/utils/debug-target';
import { getDBOperator } from '@/db';
import { DebugTarget } from '@/@types/debug-target';
import { DevicePlatform } from '@/@types/enum';
// import { SIMULATOR_DEVICE_NAME } from '@/@types/constants';
import { updateIWDPAppClient, subscribeByIWDP } from './pub-sub-manager';

export class DebugTargetManager {
  public static debugTargets: DebugTarget[] = [];

  /**
   * find all debugTargets
   *
   * @static
   * @param {string} hash auth control
   * @param {boolean} [ignoreHash=false] only use in server side, for vue-devtools find current debug ContextName
   * @memberof DebugTargetManager
   */
  public static getDebugTargets = async (hash: string, ignoreHash = false): Promise<DebugTarget[]> => {
    const { iWDPPort } = global.debugAppArgv;
    const { DB } = getDBOperator();
    const db = new DB(config.redis.debugTargetTable);
    let getDebugTargetPromise;
    if (config.isCluster && !ignoreHash) {
      getDebugTargetPromise = hash ? db.find('hash', hash) : Promise.resolve([]);
    } else {
      getDebugTargetPromise = db.getAll();
    }

    const [targets, iOSPages] = await Promise.all([getDebugTargetPromise, getIWDPPages(iWDPPort)]);
    targets.forEach((target, i) => {
      if (target.platform === DevicePlatform.IOS) {
        targets[i] = patchIOSTarget(target, iOSPages);
        updateIWDPAppClient(targets[i]);
      }
    });
    // 追加 IWDP 获取到的 h5 页面
    const iOSPagesWithFlag = iOSPages as Array<IWDPPage & { shouldRemove?: boolean }>;
    const h5Pages = iOSPagesWithFlag.filter(
      // (iOSPage) => !iOSPage.shouldRemove && iOSPage.device.deviceName !== SIMULATOR_DEVICE_NAME,
      (iOSPage) => !iOSPage.shouldRemove && !iOSPage.title.startsWith('HippyContext: '),
    );
    const h5DebugTargets = h5Pages.map(createTargetByIWDPPage);
    subscribeByIWDP(h5DebugTargets);
    DebugTargetManager.debugTargets = targets.concat(h5DebugTargets);
    return DebugTargetManager.debugTargets;
  };

  /**
   * find debugTarget by clientId
   *
   * @static
   * @param {string} clientId
   * @param {string} hash auth control
   * @param {boolean} [ignoreHash=false] only use in server side, for vue-devtools find current debug ContextName
   * @return {*}
   * @memberof DebugTargetManager
   */
  public static async findDebugTarget(clientId: string, hash: string, ignoreHash = false) {
    const debugTargets = await DebugTargetManager.getDebugTargets(hash, ignoreHash);
    return debugTargets.find((target) => target.clientId === clientId);
  }
}
