import { DevtoolsEnv } from './enum';

export interface DebugAppArgv {
  host: string;
  port: number;
  static: string;
  entry: string;
  iWDPPort: number;
  env: DevtoolsEnv;
  open: boolean;
  verbose: boolean;
}
declare namespace NodeJS {
  interface Global {
    debugAppArgv: DebugAppArgv;
  }
}
