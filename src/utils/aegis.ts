/* eslint-disable @typescript-eslint/no-unused-vars */
import Aegis from 'aegis-node-sdk';
import { config } from '@/config';
import { version } from '../../package.json';

export const aegis: any = new Aegis({
  id: config.aegisId,
  selector: {
    type: 'host',
  },
  version,
  // protocol: 'http',
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
      ext3: config.isCluster ? 'remote' : 'local',
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
