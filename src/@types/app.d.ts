import { DevtoolsEnv, DBType } from './enum';

export interface AppArgv {
  host: string;
  port: number;
  static: string;
  entry: string;
  iWDPPort: number;
  iWDPStartPort: number;
  iWDPEndPort: number;
  clearAddrInUse: boolean;
  env: DevtoolsEnv;
  publicPath?: string;
  open: boolean;
  dbType: DBType;
  useTunnel: boolean;
  useIWDP: boolean;
  useAdb: boolean;
  isRemote: boolean;
}

declare namespace NodeJS {
  interface Global {
    appArgv: AppArgv;
  }
}
