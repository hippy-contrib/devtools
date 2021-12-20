import { DevtoolsEnv, DBType } from './enum';

export interface AppArgv {
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
  config: string;
}

declare namespace NodeJS {
  interface Global {
    appArgv: AppArgv;
  }
}
