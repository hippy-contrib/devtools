import { config } from '@/config';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';
import { getDBOperator } from '@/db';
import { createTargetByIWDPPage } from '@/utils/debug-target';
import { DebugTarget } from '@/@types/debug-target';
import { DevicePlatform } from '@/@types/enum';

export class DebugTargetManager {
  public static debugTargets: DebugTarget[] = [];

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
    DebugTargetManager.debugTargets = targets.concat(h5Pages.map(createTargetByIWDPPage));
    return DebugTargetManager.debugTargets;
  };

  public static async findDebugTarget(clientId: string) {
    const debugTargets = await DebugTargetManager.getDebugTargets();
    return debugTargets.find((target) => target.clientId === clientId);
  }
}
