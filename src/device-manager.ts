import { EventEmitter } from 'events';
import { AppClientType, DeviceManagerEvent, DevicePlatform, DeviceStatus } from '@/@types/enum';
import { DeviceInfo } from '@/@types/device';
import { Logger } from '@/utils/log';
import { model } from '@/db';
import { createTargetByDeviceInfo } from '@/utils/debug-target';
import { config } from '@/config';
import { SocketServer } from '@/socket-server';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';
import { appClientManager } from '@/client/app-client-manager';

const log = new Logger('device-manager');

class DeviceManager extends EventEmitter {
  private deviceList: DeviceInfo[] = [];
  private selectedIndex = -1;
  private isAppConnected = false;

  public appDidDisConnect() {
    this.isAppConnected = false;
    const device = this.deviceList[0];
    if (!device) return;
    // tunnel 通道创建的 debugTarget 的 clientId 为 devicename
    SocketServer.cleanDebugTarget(device.devicename);
    this.emit(DeviceManagerEvent.AppDidDisConnect, this.getCurrent());
  }

  public async appDidConnect() {
    this.isAppConnected = true;
    const device = this.deviceList[0];
    if (!device) return;
    for (const device of this.deviceList) {
      const useTunnel = appClientManager.useAppClientType(device.platform, AppClientType.Tunnel);
      if (device.physicalstatus !== DeviceStatus.Disconnected && useTunnel) {
        let debugTarget = createTargetByDeviceInfo(device);
        if (debugTarget.platform === DevicePlatform.IOS) {
          const iosPages = await getIWDPPages(global.appArgv.iwdpPort);
          debugTarget = patchIOSTarget(debugTarget, iosPages);
        }
        model.upsert(config.redis.key, debugTarget.clientId, debugTarget);
        SocketServer.subscribeRedis(debugTarget);
      }
    }
    this.emit(DeviceManagerEvent.AppDidConnect, this.getCurrent());
  }

  public async getDeviceList() {
    // ⚠️ addon 目前只有 mac 版本，远程调试部署时不用加载 addon，故采用动态加载
    const { getDeviceList, selectDevice } = await import('./child-process/addon');
    getDeviceList((devices: DeviceInfo[]) => {
      log.info('getDeviceList: %j', devices);
      this.deviceList = devices;
      if (devices.length) {
        const isDeviceDisconnect = devices[this.selectedIndex]?.physicalstatus === DeviceStatus.Disconnected;
        if (isDeviceDisconnect) {
          this.selectedIndex = -1;
          return;
        }

        this.selectedIndex = 0;
        const device = this.deviceList[this.selectedIndex];
        const deviceId = device.deviceid;
        log.info(`selectDevice ${deviceId}`);
        // 目前暂不支持多设备连接，所以默认选择第一个设备
        selectDevice(deviceId);
      } else {
        this.selectedIndex = -1;
      }
    });
  }

  public getCurrent() {
    return this.deviceList[this.selectedIndex];
  }
}

export const deviceManager = new DeviceManager();
