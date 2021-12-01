import { config } from '@/config';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';
import { getDBOperator } from '@/db';
import { createTargetByIWDPPage } from '@/utils/debug-target';
import { DebugTarget } from '@/@types/debug-target';
import { DevicePlatform } from '@/@types/enum';
import { subscribeByIWDP } from './pub-sub-manager';

export class DebugTargetManager {
  public static debugTargets: DebugTarget[] = [];

  /**
   * 查询所有连接的调试对象
   */
  public static getDebugTargets = async (): Promise<DebugTarget[]> => {
    const { iWDPPort } = global.appArgv;
    const { model } = getDBOperator();
    const [targets, iOSPages] = await Promise.all([model.getAll(config.redis.key), getIWDPPages(iWDPPort)]);
    const iOSPagesWithFlag = iOSPages as Array<IWDPPage & { shouldRemove?: boolean }>;
    targets.forEach((target, i) => {
      if (target.platform === DevicePlatform.IOS) targets[i] = patchIOSTarget(target, iOSPages);
    });
    // 追加 IWDP 获取到的 h5 页面
    const h5Pages = iOSPagesWithFlag.filter((iOSPage) => !iOSPage.shouldRemove);
    const h5DebugTargets = h5Pages.map(createTargetByIWDPPage);
    subscribeByIWDP(h5DebugTargets);
    DebugTargetManager.debugTargets = targets.concat(h5DebugTargets);
    return DebugTargetManager.debugTargets;
  };

  /**
   * 根据 clientId 查询调试对象
   */
  public static async findDebugTarget(clientId: string) {
    const debugTargets = await DebugTargetManager.getDebugTargets();
    return debugTargets.find((target) => target.clientId === clientId);
  }
}
