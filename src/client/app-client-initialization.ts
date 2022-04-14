import { DevicePlatform, DebugTunnel } from '@/@types/enum';
import { customDomains } from '@/@types/constants';
import { appClientManager } from './app-client-manager';
import { IWDPAppClient } from './iwdp-app-client';
import { TunnelAppClient } from './tunnel-app-client';
import { WSAppClient } from './ws-app-client';

export const initAppClient = () => {
  const { tunnel } = global.debugAppArgv;
  const DefaultCtor = tunnel === DebugTunnel.WS ? WSAppClient : TunnelAppClient;
  appClientManager.addAndroidAppClientOption({
    useAllDomain: true,
    Ctor: DefaultCtor,
    platform: DevicePlatform.Android,
  });
  appClientManager.addIOSAppClientOption({
    useAllDomain: false,
    ignoreDomains: customDomains,
    Ctor: DefaultCtor,
    platform: DevicePlatform.IOS,
  });
  appClientManager.addIOSAppClientOption({
    useAllDomain: false,
    acceptDomains: customDomains,
    Ctor: IWDPAppClient,
    platform: DevicePlatform.IOS,
  });
};
