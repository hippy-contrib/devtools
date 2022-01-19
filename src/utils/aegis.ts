import Aegis from '@tencent/aegis-node-sdk';
import { config } from '@/config';
import { version } from '../../package.json';

export const aegis = new Aegis({
  id: config.aegisId,
  uin: '',
  delay: 3000,
  version,
});

export const timeStart = (name: string) => {
  const start = Date.now();
  return (ext: ExtOption = {}) => {
    const end = Date.now();
    const duration = end - start;
    aegis.reportTime({
      name,
      duration,
      ...ext,
    });
  };
};

type ExtOption = {
  ext1?: string;
  ext2?: string;
  ext3?: string;
};

export const createCDPPerformance = (perf?: Partial<Adapter.Performance>): Adapter.Performance => ({
  devtoolsToDebugServer: 0,
  debugServerReceiveFromDevtools: 0,
  debugServerToApp: 0,
  appReceive: 0,
  appResponse: 0,
  debugServerReceiveFromApp: 0,
  debugServerToDevtools: 0,
  devtoolsReceive: 0,
  ...(perf || {}),
});
