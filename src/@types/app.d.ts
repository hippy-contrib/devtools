import { DevtoolsEnv, DebugTunnel, LogLevel } from './enum';

export interface DebugAppArgv {
  host: string;
  port: number;
  static: string;
  entry: string;
  iWDPPort: number;
  env: DevtoolsEnv;
  tunnel?: DebugTunnel;
  open: boolean;
  log: LogLevel;
  help?: boolean;
  version?: boolean;
  iWDPStartPort?: number;
  iWDPEndPort?: number;
}

declare global {
  var debugAppArgv: DebugAppArgv;
}
