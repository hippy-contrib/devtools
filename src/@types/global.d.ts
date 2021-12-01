declare namespace NodeJS {
  interface Global {
    addon: Addon;
  }
}

interface Addon {
  addEventListener: (event: string, data: unknown) => void;
  tunnelStart: (adbPath: string, iWDPParams: string) => void;
  getDeviceList: (cb: (devices: Array<DeviceInfo>) => void) => void;
  selectDevice: (deviceId: string) => void;
  sendMsg: (msg: string) => void;
  exit: () => void;
}
