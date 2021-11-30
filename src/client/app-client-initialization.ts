import { androidMiddleWareManager, iOSMiddleWareManager } from '@/middlewares';
import { DevicePlatform, DevtoolsEnv } from '@/@types/enum';
import { appClientManager } from './app-client-manager';
import { IWDPAppClient } from './iwdp-app-client';
import { TunnelAppClient } from './tunnel-app-client';
import { WsAppClient } from './ws-app-client';

export const initAppClient = () => {
  const initFn = {
    [DevtoolsEnv.Hippy]: initHippyEnv,
    [DevtoolsEnv.Voltron]: initVoltronEnv,
    [DevtoolsEnv.TDF]: initTdfEnv,
    [DevtoolsEnv.TDFCore]: initTdfCoreEnv,
  }[global.appArgv.env];
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
const initHippyEnv = () => {
  appClientManager.reset();
  appClientManager.addAndroidAppClientOption({
    useAllDomain: true,
    middleWareManager: androidMiddleWareManager,
    Ctor: WsAppClient,
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
    Ctor: WsAppClient,
    platform: DevicePlatform.IOS,
  });
};

/**
 * voltron，暂时与 hippy 一致
 */
const initVoltronEnv = () => {
  appClientManager.reset();
  initHippyEnv();
};

/**
 * TDF
 *  - 安卓
 *    - tunnel 通道
 *  - ios
 *    - 自实现协议走 tunnel 通道
 *    - jsc 实现的协议走 IWDP 通道
 */
const initTdfEnv = () => {
  appClientManager.reset();
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
const initTdfCoreEnv = () => {
  appClientManager.reset();
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
