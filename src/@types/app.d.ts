import { DevtoolsEnv, LogLevel } from './enum';

export interface DebugAppArgv {
  host: string;
  port: number;
  static: string;
  entry: string;
  iWDPPort: number;
  env: DevtoolsEnv;
  open: boolean;
  log: LogLevel;
}
declare namespace NodeJS {
  interface Global {
    debugAppArgv: DebugAppArgv;
  }
}
