/**
 * ios 有三个通道：
 *    - ws 通道：在 ws on connection 时追加可调试页面，on close 时移除
 *    - tunnel 通道：tunnel app connect 时添加可调试页面， app disconnect 时移除，device disconnect时清空
 *    - IWDP 通道：直接通过 IWDP get 接口拉取
 * 优先级：IWDP > tunnel > ws
 */
import { add, remove } from '@/utils/array';
import { Logger } from '@/utils/log';

const log = new Logger('ios-debug-target-manager');

class IosDebugTargetManager {
  public useCustom = false;
  private wsTargetIdList: string[] = [];
  private customTargetIdList: string[] = [];

  public getTargetIdList() {
    return this.useCustom ? this.customTargetIdList : this.wsTargetIdList;
  }

  public addWsTarget(id: string) {
    log.info('ios ws target connect.');
    add(this.wsTargetIdList, id);
  }

  public removeWsTarget(id: string) {
    log.info('ios ws target disconnect.');
    remove(this.wsTargetIdList, id);
  }

  public clearCustomTarget() {
    this.customTargetIdList = [];
  }

  public addCustomTarget(id: string) {
    log.info('ios custom target connect.');
    add(this.customTargetIdList, id);
  }

  public removeCustomTarget(id: string) {
    log.info('ios custom target disconnect.');
    remove(this.customTargetIdList, id);
  }
}

export const iosDebugTargetManager = new IosDebugTargetManager();
