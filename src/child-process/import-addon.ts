import os from 'os';
import { OSType } from '@/@types/enum';
import { Logger } from '@/utils/log';

const log = new Logger('import-tunnel');

export const importTunnel = async () => {
  const osType = os.type();
  if (osType === OSType.Darwin) {
    if (process.arch === 'arm64') {
      return import('./import-addon-mac-arm64');
    }
    return import('./import-addon-mac-x86');
  }
  if (osType === OSType.Windows) {
    return import('./import-addon-win');
  }
  if (osType === OSType.Linux) {
    log.error('hippy debug server does not support linux.');
  }
};
