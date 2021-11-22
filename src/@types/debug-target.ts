import { DevicePlatform, AppClientType } from './enum';

export interface DebugTarget {
  // 和 bundleName 一一对应，reload 时终端也尽量保持不变
  clientId: string;
  iwdpWsUrl?: string;
  devtoolsFrontendUrl: string;
  faviconUrl?: string;
  thumbnailUrl: string;
  title: string;
  url: string;
  description: string;
  webSocketDebuggerUrl: string;
  devtoolsFrontendUrlCompat?: string;
  platform: DevicePlatform;
  appClientTypeList?: AppClientType[];
  type: string;
  appId?: string;
  deviceName: string;
  deviceId?: string;
  deviceOSVersion?: string;
  imei?: string;
}