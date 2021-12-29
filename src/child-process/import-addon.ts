import os from 'os';
import { OSType } from '@/@types/enum';
import { Logger } from '@/utils/log';

const log = new Logger('import-tunnel');

export const importTunnel = async () => {
  const osType = os.type();
  if (osType === OSType.Darwin) {
    return import('./import-addon-mac');
  }
  if (osType === OSType.Windows) {
    return import('./import-addon-win');
  }
  if (osType === OSType.Linux) {
    log.error('tunnel does not support linux.');
  }
};
