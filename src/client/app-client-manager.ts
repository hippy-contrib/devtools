import { AppClientType, DevicePlatform } from '@/@types/enum';
import { AppClient, AppClientOption } from './app-client';

/**
 * 管理不同调试器的 AppClient 通道
 */
class AppClientManager {
  private androidAppClientOptionList: AppClientFullOptionOmicCtx[] = [];
  private iOSAppClientOptionList: AppClientFullOptionOmicCtx[] = [];

  public addAndroidAppClientOption(appClientOption: AppClientFullOptionOmicCtx) {
    this.androidAppClientOptionList.push(appClientOption);
  }

  public getAppClientOptions(platform: DevicePlatform) {
    if (platform === DevicePlatform.Android) return this.androidAppClientOptionList;
    if ((platform = DevicePlatform.IOS)) return this.iOSAppClientOptionList;
  }

  public addIOSAppClientOption(appClientOption: AppClientFullOptionOmicCtx) {
    this.iOSAppClientOptionList.push(appClientOption);
  }

  public reset() {
    this.androidAppClientOptionList = [];
    this.iOSAppClientOptionList = [];
  }

  public useAppClientType(platform: DevicePlatform, type: AppClientType): boolean {
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
