import { AppClientType, DevicePlatform } from '@/@types/enum';
import { androidMiddleWareManager, iosMiddleWareManager } from '@/middlewares';
import { AppClient, AppClientOption } from './app-client';
import { IwdpAppClient } from './iwdp-app-client';
import { TunnelAppClient } from './tunnel-app-client';
import { WsAppClient } from './ws-app-client';

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
 * 管理不同调试器的 AppClient 通道
 */
class AppClientManager {
  private androidAppClientOptionList: AppClientFullOptionOmicCtx[] = [];
  private iosAppClientOptionList: AppClientFullOptionOmicCtx[] = [];

  public getAndroidAppClientOptions() {
    return this.androidAppClientOptionList;
  }

  public addAndroidAppClientOption(appClientOption: AppClientFullOptionOmicCtx) {
    this.androidAppClientOptionList.push(appClientOption);
  }

  public getIosAppClientOptions() {
    return this.iosAppClientOptionList;
  }

  public addIosAppClientOption(appClientOption: AppClientFullOptionOmicCtx) {
    this.iosAppClientOptionList.push(appClientOption);
  }

  public reset() {
    this.androidAppClientOptionList = [];
    this.iosAppClientOptionList = [];
  }

  public useAppClientType(platform: DevicePlatform, type: AppClientType): boolean {
    const getAppClientOptions = {
      [DevicePlatform.Android]: this.getAndroidAppClientOptions,
      [DevicePlatform.IOS]: this.getIosAppClientOptions,
    }[platform];
    const options: AppClientFullOptionOmicCtx[] = getAppClientOptions.call(this);
    return Boolean(options.find((item) => item.Ctor.name === type));
  }
}

export const appClientManager = new AppClientManager();

/**
 * hippy
 *  - 安卓走 ws 通道
 *  - iOS 走 IWDP + ws 通道
 */
export const initHippyEnv = () => {
  appClientManager.reset();
  appClientManager.addAndroidAppClientOption({
    useAllDomain: true,
    middleWareManager: androidMiddleWareManager,
    Ctor: WsAppClient,
    platform: DevicePlatform.Android,
  });
  appClientManager.addIosAppClientOption({
    useAllDomain: false,
    ignoreDomains: customDomains,
    middleWareManager: iosMiddleWareManager,
    Ctor: IwdpAppClient,
    platform: DevicePlatform.IOS,
  });
  appClientManager.addIosAppClientOption({
    useAllDomain: false,
    acceptDomains: customDomains,
    middleWareManager: iosMiddleWareManager,
    Ctor: WsAppClient,
    platform: DevicePlatform.IOS,
  });
};

/**
 * voltron，暂时与 hippy 一致
 */
export const initVoltronEnv = () => {
  appClientManager.reset();
  initHippyEnv();
};

/**
 * TDF
 *  - 安卓
 *    - tunnel通道
 *  - ios
 *    - 自实现协议走 tunnel 通道
 *    - jsc 实现的协议走 IWDP 通道
 */
export const initTdfEnv = () => {
  appClientManager.reset();
  appClientManager.addAndroidAppClientOption({
    useAllDomain: true,
    middleWareManager: androidMiddleWareManager,
    Ctor: TunnelAppClient,
    platform: DevicePlatform.Android,
  });
  appClientManager.addIosAppClientOption({
    useAllDomain: false,
    ignoreDomains: customDomains,
    middleWareManager: iosMiddleWareManager,
    Ctor: IwdpAppClient,
    platform: DevicePlatform.IOS,
  });
  appClientManager.addIosAppClientOption({
    useAllDomain: false,
    acceptDomains: customDomains,
    middleWareManager: iosMiddleWareManager,
    Ctor: TunnelAppClient,
    platform: DevicePlatform.IOS,
  });
};

/**
 * TDFCore
 *  - 安卓：tunnel 通道
 *  - ios：tunnel 通道
 */
export const initTdfCoreEnv = () => {
  appClientManager.reset();
  appClientManager.addAndroidAppClientOption({
    useAllDomain: true,
    middleWareManager: androidMiddleWareManager,
    Ctor: TunnelAppClient,
    platform: DevicePlatform.Android,
  });
  appClientManager.addIosAppClientOption({
    useAllDomain: true,
    middleWareManager: iosMiddleWareManager,
    Ctor: TunnelAppClient,
    platform: DevicePlatform.IOS,
  });
};

export type AppClientFullOption = AppClientOption & {
  // 构造器外部注入，可在 TDF 上做扩展
  Ctor: new (id: string, option: AppClientOption) => AppClient;
};

export type AppClientFullOptionOmicCtx = Omit<AppClientFullOption, 'urlParsedContext'>;
