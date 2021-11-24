import { config } from '@/config';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';
import { model } from '@/db';
import { createTargetByIwdpPage } from '@/utils/debug-target';
import { DebugTarget } from '@/@types/debug-target';
import { DevicePlatform } from 'src/@types/enum';

export class DebugTargetManager {
  public static debugTargets: DebugTarget[] = [];

  public static getDebugTargets = async (): Promise<DebugTarget[]> => {
    const { iwdpPort } = global.appArgv;
    const [targets, iosPages] = await Promise.all([model.getAll(config.redis.key), getIWDPPages(iwdpPort)]);
    const iosPagesWithFlag = iosPages as Array<IWDPPage & { shouldRemove?: boolean }>;
    targets.forEach((target, i) => {
      if (target.platform === DevicePlatform.IOS) targets[i] = patchIOSTarget(target, iosPages);
    });
    // 追加 IWDP 获取到的 h5 页面
    const h5Pages = iosPagesWithFlag.filter((iosPage) => !iosPage.shouldRemove);
    DebugTargetManager.debugTargets = targets.concat(h5Pages.map(createTargetByIwdpPage));
    return DebugTargetManager.debugTargets;
  };

  public static async findDebugTarget(clientId: string) {
    const debugTargets = await DebugTargetManager.getDebugTargets();
    return debugTargets.find((target) => target.clientId === clientId);
  }
}
