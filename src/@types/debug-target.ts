import { DevicePlatform, AppClientType } from './enum';

export interface DebugTarget {
  // bundle version hash id, only relate to compilination machine id and process.cwd()
  hash?: string;
  // unique by bundleName, should keep immutable when reload
  clientId: string;
  iWDPWsUrl?: string;
  devtoolsFrontendUrl: string;
  faviconUrl?: string;
  thumbnailUrl: string;
  title: string;
  url: string;
  description: string;
  webSocketDebuggerUrl: string;
  platform: DevicePlatform;
  appClientTypeList: AppClientType[];
  type: string;
  ts: number;
  deviceName: string;
  deviceId?: string;
  deviceOSVersion?: string;
  // DebugTarget reference num, every time create with same clientId will increase
  // every time clean will decrease, and will remove this record when ref === 0
  // To be compatible with iOS reload scene, the new ws will firstly connect, then the old will close
  // so we could keep the old DebugTarget.
  ref: number;
}
