/* eslint-disable @typescript-eslint/no-unused-vars */
import { config } from '@/config';

/**
 * remove report because aegis could not access in npm registry
 */
export const aegis = {
  reportEvent: (argv: unknown) => {},
  reportTime: (argv: unknown) => {},
  report: (argv: unknown) => {},
};

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
