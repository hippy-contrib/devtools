import { androidMiddleWareManager, iOSMiddleWareManager } from '@/middlewares';
import { DevicePlatform, DevtoolsEnv } from '@/@types/enum';
import { appClientManager } from './app-client-manager';
import { IWDPAppClient } from './iwdp-app-client';
import { TunnelAppClient } from './tunnel-app-client';
import { WSAppClient } from './ws-app-client';

export const initAppClient = () => {
  const initFn = {
    [DevtoolsEnv.Hippy]: initHippyAppClient,
    [DevtoolsEnv.Voltron]: initVoltronAppClient,
    [DevtoolsEnv.TDF]: initTDFAppClient,
    [DevtoolsEnv.TDFCore]: initTdfCoreAppClient,
  }[global.debugAppArgv.env];
  initFn();
};

// 终端自己实现的调试协议域名
const customDomains = [
  'Page',
  'DOM',
  'CSS',
  'Overlay',
  'TDFInspector',
  'TDFPerformance',
  'TDFMemory',
  'TDFLog',
  'TDFRuntime',
];

/**
 * hippy
 *  - 安卓走 ws 通道
 *  - iOS 走 IWDP + ws 通道
 */
const initHippyAppClient = () => {
  appClientManager.clear();
  appClientManager.addAndroidAppClientOption({
    useAllDomain: true,
    middleWareManager: androidMiddleWareManager,
    Ctor: WSAppClient,
    platform: DevicePlatform.Android,
  });
  appClientManager.addIOSAppClientOption({
    useAllDomain: false,
    ignoreDomains: customDomains,
    middleWareManager: iOSMiddleWareManager,
    Ctor: IWDPAppClient,
    platform: DevicePlatform.IOS,
  });
  appClientManager.addIOSAppClientOption({
    useAllDomain: false,
    acceptDomains: customDomains,
    middleWareManager: iOSMiddleWareManager,
    Ctor: WSAppClient,
    platform: DevicePlatform.IOS,
  });
};

/**
 * voltron，暂时与 hippy 一致
 */
const initVoltronAppClient = () => {
  appClientManager.clear();
  initHippyAppClient();
};

/**
 * TDF
 *  - 安卓
 *    - tunnel 通道
 *  - ios
 *    - 自实现协议走 tunnel 通道
 *    - jsc 实现的协议走 IWDP 通道
 */
const initTDFAppClient = () => {
  appClientManager.clear();
  appClientManager.addAndroidAppClientOption({
    useAllDomain: true,
    middleWareManager: androidMiddleWareManager,
    Ctor: TunnelAppClient,
    platform: DevicePlatform.Android,
  });
  appClientManager.addIOSAppClientOption({
    useAllDomain: false,
    ignoreDomains: customDomains,
    middleWareManager: iOSMiddleWareManager,
    Ctor: IWDPAppClient,
    platform: DevicePlatform.IOS,
  });
  appClientManager.addIOSAppClientOption({
    useAllDomain: false,
    acceptDomains: customDomains,
    middleWareManager: iOSMiddleWareManager,
    Ctor: TunnelAppClient,
    platform: DevicePlatform.IOS,
  });
};

/**
 * TDFCore
 *  - 安卓：tunnel 通道
 *  - ios：tunnel 通道
 */
const initTdfCoreAppClient = () => {
  appClientManager.clear();
  appClientManager.addAndroidAppClientOption({
    useAllDomain: true,
    middleWareManager: androidMiddleWareManager,
    Ctor: TunnelAppClient,
    platform: DevicePlatform.Android,
  });
  appClientManager.addIOSAppClientOption({
    useAllDomain: true,
    middleWareManager: iOSMiddleWareManager,
    Ctor: TunnelAppClient,
    platform: DevicePlatform.IOS,
  });
};
