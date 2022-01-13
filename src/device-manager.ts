import { AppClientType, DeviceStatus } from '@/@types/enum';
import { DeviceInfo } from '@/@types/device';
import { Logger } from '@/utils/log';
import { getDBOperator } from '@/db';
import { createTargetByDeviceInfo, patchDebugTarget } from '@/utils/debug-target';
import { config } from '@/config';
import { appClientManager } from '@/client/app-client-manager';
import { cleanDebugTarget, subscribeCommand } from '@/controller/pub-sub-manager';

const log = new Logger('device-manager');

class DeviceManager {
  private deviceList: DeviceInfo[] = [];

  /**
   * app 断连，清理调试对象
   */
  public onAppDisconnect() {
    const device = this.deviceList[0];
    if (!device) return;
    // 通过 tunnel 通道创建的 debugTarget 的 clientId 为 devicename
    cleanDebugTarget(device.devicename, false);
  }

  /**
   * app 连接，添加调试对象，并订阅上行调试指令
   */
  public async onAppConnect() {
    log.info('app connect, %j', this.deviceList);
    const device = this.deviceList[0];
    if (!device) return log.warn('no device connect!');

    const useTunnel = appClientManager.shouldUseAppClientType(device.platform, AppClientType.Tunnel);
    log.info('useTunnel %j, is connected %j', useTunnel, device.physicalstatus === DeviceStatus.Connected);
    if (device.physicalstatus === DeviceStatus.Connected && useTunnel) {
      try {
        let debugTarget = createTargetByDeviceInfo(device);
        debugTarget = await patchDebugTarget(debugTarget);
        const { DB } = getDBOperator();
        log.info('before upsert db %j', debugTarget);
        new DB(config.redis.debugTargetTable).upsert(debugTarget.clientId, debugTarget);
        subscribeCommand(debugTarget);
      } catch (e) {
        log.info('app connect e, %j, %j', (e as any)?.stack, e);
      }
    }
  }

  /**
   * 查询 USB 连接的设备列表
   */
  public async getDeviceList() {
    global.addon.getDeviceList((devices: DeviceInfo[]) => {
      log.info('getDeviceList: %j', devices);
      this.deviceList = devices;
      if (devices.length) {
        const isDeviceDisconnect = devices[0].physicalstatus === DeviceStatus.Disconnected;
        if (isDeviceDisconnect) return;

        // 目前暂不支持多设备连接，所以默认选择第一个设备
        const device = this.deviceList[0];
        const deviceId = device.deviceid;
        log.info(`selectDevice ${deviceId}`);
        global.addon.selectDevice(deviceId);
      }
    });
  }
}

export const deviceManager = new DeviceManager();
