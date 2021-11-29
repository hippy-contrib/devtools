import { AppClientType, DeviceStatus } from '@/@types/enum';
import { DeviceInfo } from '@/@types/device';
import { Logger } from '@/utils/log';
import { getDBOperator } from '@/db';
import { createTargetByDeviceInfo, patchDebugTarget } from '@/utils/debug-target';
import { config } from '@/config';
import { SocketServer } from '@/socket-server';
import { appClientManager } from '@/client/app-client-manager';

const log = new Logger('device-manager');

class DeviceManager {
  private deviceList: DeviceInfo[] = [];

  public onAppDisconnect() {
    const device = this.deviceList[0];
    if (!device) return;
    // 通过 tunnel 通道创建的 debugTarget 的 clientId 为 devicename
    SocketServer.cleanDebugTarget(device.devicename);
  }

  public async onAppConnect() {
    const device = this.deviceList[0];
    if (!device) return;

    const useTunnel = appClientManager.useAppClientType(device.platform, AppClientType.Tunnel);
    if (device.physicalstatus === DeviceStatus.Connected && useTunnel) {
      let debugTarget = createTargetByDeviceInfo(device);
      debugTarget = await patchDebugTarget(debugTarget);
      const { model } = getDBOperator();
      model.upsert(config.redis.key, debugTarget.clientId, debugTarget);
      SocketServer.subscribeRedis(debugTarget);
    }
  }

  public async getDeviceList() {
    // ⚠️ addon 目前只有 mac 版本，远程调试部署时不用加载 addon，故采用动态加载
    const { getDeviceList, selectDevice } = await import('./child-process/addon');
    getDeviceList((devices: DeviceInfo[]) => {
      log.info('getDeviceList: %j', devices);
      this.deviceList = devices;
      if (devices.length) {
        const isDeviceDisconnect = devices[0].physicalstatus === DeviceStatus.Disconnected;
        if (isDeviceDisconnect) return;

        // 目前暂不支持多设备连接，所以默认选择第一个设备
        const device = this.deviceList[0];
        const deviceId = device.deviceid;
        log.info(`selectDevice ${deviceId}`);
        selectDevice(deviceId);
      }
    });
  }
}

export const deviceManager = new DeviceManager();
