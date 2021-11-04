import { EventEmitter } from 'events';
import { DeviceManagerEvent, DeviceStatus } from './@types/enum';
import { DeviceInfo } from './@types/tunnel';
import { getDebugTargetManager } from './target-manager';
import { getDeviceList, selectDevice } from './child-process/addon';
import { Logger } from './utils/log';

const log = new Logger('device-manager');

class DeviceManager extends EventEmitter {
  deviceList: DeviceInfo[] = [];
  selectedIndex = -1;
  isAppConnected = false;

  addDevice(device: DeviceInfo) {
    if (!this.deviceList.find((item) => item.deviceid === device.deviceid)) {
      this.deviceList.splice(this.deviceList.length - 1, 0, device);
    }
    this.emit(DeviceManagerEvent.addDevice, device);
  }

  removeDevice(device: DeviceInfo) {
    const deviceIndex = this.deviceList.findIndex((item) => item.deviceid === device.deviceid);
    if (deviceIndex > 0) {
      this.deviceList.splice(deviceIndex, 1);
    }
    this.emit(DeviceManagerEvent.removeDevice, device);
  }

  appDidDisConnect() {
    this.isAppConnected = false;
    // state.selectedIndex = -1;
    const device = this.deviceList[0];
    if (!device) return;
    getDebugTargetManager(device.platform).clearCustomTarget();
    this.emit(DeviceManagerEvent.appDidDisConnect, this.getCurrent());
  }

  appDidConnect() {
    this.isAppConnected = true;
    const device = this.deviceList[0];
    if (!device) return;
    const debugTargetManager = getDebugTargetManager(device.platform);
    debugTargetManager.clearCustomTarget();
    for (const device of this.deviceList) {
      if (device.physicalstatus !== DeviceStatus.Disconnected) {
        debugTargetManager.addCustomTarget(device.deviceid);
      }
    }
    this.emit(DeviceManagerEvent.appDidConnect, this.getCurrent());
  }

  getDeviceList() {
    getDeviceList((devices: DeviceInfo[]) => {
      log.info('getDeviceList: %j', devices);

      this.deviceList = devices;
      if (devices.length) {
        const isDeviceDisconnect = devices[this.selectedIndex]?.physicalstatus === DeviceStatus.Disconnected;
        if (isDeviceDisconnect) {
          this.selectedIndex = -1;
          return;
        }

        if (this.selectedIndex < 0) {
          this.selectedIndex = 0;
          const device = this.deviceList[this.selectedIndex];
          const deviceId = device.deviceid;
          log.info(`selectDevice ${deviceId}`);
          selectDevice(deviceId);
        }
      } else {
        this.selectedIndex = -1;
      }
    });
  }

  getCurrent() {
    return this.deviceList[this.selectedIndex];
  }
}

export default new DeviceManager();
