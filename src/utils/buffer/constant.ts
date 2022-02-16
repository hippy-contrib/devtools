import { HMREvent } from '@/@types/enum';

export enum HMREventMap {
  Hot = 1,
  LiveReload,
  Invalid,
  Hash,
  Logging,
  Overlay,
  Reconnect,
  Progress,
  Ok,
  Warnings,
  Errors,
  Error,
  Close,
  ProgressUpdate,
  StillOk,
  ContentChanged,
  StaticChanged,
  TransferFile,
}

export type EmitFile = {
  name: string;
  content: Buffer;
};

export type HMRMessage = {
  type: HMREvent;
  data: unknown;
  params: unknown;
};

export type HMRWSData = {
  emitList: EmitFile[];
  messages: HMRMessage[];
  performance?: {
    pcToServer?: number;
    serverReceive?: number;
    serverToApp?: number;
    appReceive?: number;
  };
  hadSyncBundleResource?: boolean;
};
