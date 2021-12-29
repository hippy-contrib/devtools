interface IWDPPage {
  devtoolsFrontendUrl: string;
  faviconUrl: string;
  thumbnailUrl: string;
  title: string;
  url: string;
  webSocketDebuggerUrl: string;
  appId: string;
  device: IWDPDevice;
}

interface IWDPDevice {
  deviceId: string;
  deviceName: string;
  deviceOSVersion: string;
  url: string;
}
