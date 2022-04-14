import { AppClientType, DevicePlatform } from '@/@types/enum';
import { AppClient, AppClientOption } from './app-client';

/**
 * 管理不同调试器的 AppClient 通道
 */
class AppClientManager {
  private androidAppClientOptionList: AppClientFullOptionOmicCtx[] = [];
  private iOSAppClientOptionList: AppClientFullOptionOmicCtx[] = [];

  /**
   * 添加安卓 AppClient 构造器 option
   */
  public addAndroidAppClientOption(appClientOption: AppClientFullOptionOmicCtx) {
    this.androidAppClientOptionList.push(appClientOption);
  }

  /**
   * 根据平台查询 AppClient 构造器 options
   */
  public getAppClientOptions(platform: DevicePlatform) {
    if (platform === DevicePlatform.Android) return this.androidAppClientOptionList;
    if (platform === DevicePlatform.IOS) return this.iOSAppClientOptionList;
  }

  /**
   * 添加 iOS AppClient 构造器 option
   */
  public addIOSAppClientOption(appClientOption: AppClientFullOptionOmicCtx) {
    this.iOSAppClientOptionList.push(appClientOption);
  }

  /**
   * 清空 AppClient 构造器 options
   */
  public clear() {
    this.androidAppClientOptionList = [];
    this.iOSAppClientOptionList = [];
  }

  /**
   * 根据平台查询是否 AppClientType 可用
   */
  public shouldUseAppClientType(platform: DevicePlatform, type: AppClientType): boolean {
    const options: AppClientFullOptionOmicCtx[] = this.getAppClientOptions(platform);
    return Boolean(options.find((item) => item.Ctor.name === type));
  }
}

export const appClientManager = new AppClientManager();

export type AppClientFullOption = AppClientOption & {
  // 构造器外部注入，可在 TDF 上做扩展
  Ctor: new (id: string, option: AppClientOption) => AppClient;
};

export type AppClientFullOptionOmicCtx = Omit<AppClientFullOption, 'urlParsedContext'>;

export type FrameworkConfig = {
  useAllDomain: boolean;
  ignoreDomains: string[];
  acceptDomains: string[];
  platform: DevicePlatform;
  Ctor: AppClient;
};
