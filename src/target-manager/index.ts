import { DevicePlatform } from '@/@types/enum';
import { androidDebugTargetManager } from './android-debug-target-manager';
import { iosDebugTargetManager } from './ios-debug-target-manager';

export * from './android-debug-target-manager';
export * from './ios-debug-target-manager';
export const getDebugTargetManager = (platform: DevicePlatform) => {
  if (platform === DevicePlatform.Android) return androidDebugTargetManager;
  if (platform === DevicePlatform.IOS) return iosDebugTargetManager;
};
