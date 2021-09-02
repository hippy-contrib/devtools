/**
 * 安卓有两个通道：
 *    - ws通道：在 ws on connection 时追加可调试页面，on close 时移除
 *    - tunnel通道：tunnel app connect 时添加可调试页面， app disconnect 时移除，device disconnect时清空
 * 两通道共存时，走tunnel通道
 */
import { add, remove } from './utils/array';
import { Logger } from './utils/log';

const log = new Logger('socket-bridge');

class AndroidDebugTargetManager {
  public useCustom = false;
  private wsTargetIdList: string[] = [];
  private customTargetIdList: string[] = [];

  public getTargetIdList() {
    return this.useCustom ? this.customTargetIdList : this.wsTargetIdList;
  }

  public addWsTarget(id: string) {
    log.info('android ws target connect.');
    add(this.wsTargetIdList, id);
  }

  public removeWsTarget(id: string) {
    log.info('android ws target disconnect.');
    remove(this.wsTargetIdList, id);
  }

  public clearCustomTarget() {
    this.customTargetIdList = [];
  }

  public addCustomTarget(id: string) {
    log.info('android custom target connect.');
    add(this.customTargetIdList, id);
  }

  public removeCustomTarget(id: string) {
    log.info('android custom target disconnect.');
    remove(this.customTargetIdList, id);
  }
}

export const androidDebugTargetManager = new AndroidDebugTargetManager();
