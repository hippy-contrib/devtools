import { DevtoolsEnv, DBType } from './enum';
export interface AppArgv {
  host: string;
  port: number;
  static: string;
  entry: string;
  iwdpPort: number;
  iwdpStartPort: number;
  iwdpEndPort: number;
  startAdb: boolean;
  startIWDP: boolean;
  clearAddrInUse: boolean;
  startTunnel: boolean;
  env: DevtoolsEnv;
  publicPath?: string;
  cachePath: string;
  logPath: string;
  open: boolean;
  dbType: DBType;
}

declare namespace NodeJS {
  interface Global {
    appArgv: AppArgv;
  }
}
