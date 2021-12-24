import { TunnelEvent } from '@/@types/enum';
import { DeviceInfo } from '@/@types/device.d';

export interface Addon {
  addEventListener: (cb: (event: TunnelEvent, data: unknown) => void) => void;
  tunnelStart: (option: StartTunnelOption) => void;
  getDeviceList: (cb: (devices: Array<DeviceInfo>) => void) => void;
  selectDevice: (deviceId: string) => void;
  sendMsg: (msg: string) => void;
}

export interface StartTunnelOption {
  adb_path: string;
  iwdp: {
    iwdp_params: string[];
    iwdp_listen_port: string;
    iwdp_path?: string;
  };
  only_use_iwdp: number;
  iproxy_path?: string;
  idevice_info_path?: string;
}
