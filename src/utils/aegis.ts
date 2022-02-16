import Aegis from '@tencent/aegis-node-sdk';
import { config } from '@/config';
import { ReportExt3 } from '@/@types/enum';
import { version } from '../../package.json';

export const aegis = new Aegis({
  id: config.aegisId,
  uin: '',
  delay: 3000,
  version,
  ext3: config.isRemote ? ReportExt3.Remote : ReportExt3.Local,
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
      ext3: config.isRemote ? 'remote' : 'local',
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
  debugServerToDevtools: 0,
  devtoolsReceive: 0,
  ...(perf || {}),
});
