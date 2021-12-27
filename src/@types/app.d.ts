import { DevtoolsEnv, DBType } from './enum';

export interface DebugAppArgv {
  host: string;
  port: number;
  hmrPort: number;
  static: string;
  entry: string;
  iWDPPort: number;
  iWDPStartPort: number;
  iWDPEndPort: number;
  clearAddrInUse: boolean;
  env: DevtoolsEnv;
  open: boolean;
  dbType: DBType;
  isRemote: boolean;
}

export interface DevAppArgv {
  config: string;
}

declare namespace NodeJS {
  interface Global {
    debugAppArgv: DebugAppArgv;
    devAppArgv: DevAppArgv;
  }
}
