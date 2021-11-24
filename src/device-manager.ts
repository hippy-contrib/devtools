import { EventEmitter } from 'events';
import { AppClientType, DeviceManagerEvent, DevicePlatform, DeviceStatus } from '@/@types/enum';
import { DeviceInfo } from '@/@types/device';
import { Logger } from '@/utils/log';
import { model, createTargetByTunnel } from '@/db';
import { config } from '@/config';
import { SocketServer } from '@/socket-server';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';
import { appClientManager } from '@/client/app-client-manager';

const log = new Logger('device-manager');

class DeviceManager extends EventEmitter {
  deviceList: DeviceInfo[] = [];
  selectedIndex = -1;
  isAppConnected = false;

  public appDidDisConnect() {
    this.isAppConnected = false;
    // state.selectedIndex = -1;
    const device = this.deviceList[0];
    if (!device) return;
    model.delete(config.redis.key, device.devicename);
    SocketServer.clean(device.devicename);
    this.emit(DeviceManagerEvent.appDidDisConnect, this.getCurrent());
  }

  public async appDidConnect() {
    this.isAppConnected = true;
    const device = this.deviceList[0];
    if (!device) return;
    for (const device of this.deviceList) {
      const useTunnel = appClientManager.useAppClientType(device.platform, AppClientType.Tunnel);
      if (device.physicalstatus !== DeviceStatus.Disconnected && useTunnel) {
        let debugTarget = createTargetByTunnel(device);
        if (debugTarget.platform === DevicePlatform.IOS) {
          const iosPages = await getIWDPPages(global.appArgv.iwdpPort);
          debugTarget = patchIOSTarget(debugTarget, iosPages);
        }
        model.upsert(config.redis.key, debugTarget.clientId, debugTarget);
        SocketServer.subscribeRedis(debugTarget);
      }
    }
    this.emit(DeviceManagerEvent.appDidConnect, this.getCurrent());
  }

  public getDeviceList() {
    import('./child-process/addon').then(({ getDeviceList, selectDevice }) => {
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
          selectDevice(deviceId);
        } else {
          this.selectedIndex = -1;
        }
      });
    });
  }

  public getCurrent() {
    return this.deviceList[this.selectedIndex];
  }
}

export const deviceManager = new DeviceManager();
