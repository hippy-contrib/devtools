interface IWDPPage {
  devtoolsFrontendUrl: string;
  faviconUrl: string;
  thumbnailUrl: string;
  title: string;
  url: string;
  webSocketDebuggerUrl: string;
  appId: string;
  device: {
    deviceId: string;
    deviceName: string;
    deviceOSVersion: string;
    url: string;
  };
}
