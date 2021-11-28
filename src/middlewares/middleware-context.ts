import { DevicePlatform } from '@/@types/enum';
import { DebugTarget } from '@/@types/debug-target';

export interface ContextBase {
  url?: string;
}

export interface UrlParsedContext extends ContextBase {
  clientId: string;
  debugTarget: DebugTarget;
  platform: DevicePlatform;
}

export interface MiddleWareContext extends UrlParsedContext {
  msg: Adapter.CDP.Req | Adapter.CDP.Res;
  sendToApp: (msg: Adapter.CDP.Req) => Promise<Adapter.CDP.Res>;
  sendToDevtools: (msg: Adapter.CDP.Res) => Promise<Adapter.CDP.Res>;
}

export type MiddleWare = (ctx: MiddleWareContext, next?: () => Promise<Adapter.CDP.Res>) => Promise<Adapter.CDP.Res>;

export interface MiddleWareManager {
  upwardMiddleWareListMap?: { [k: string]: Array<MiddleWare> | MiddleWare };
  downwardMiddleWareListMap?: { [k: string]: Array<MiddleWare> | MiddleWare };
}

export const debugTargetToUrlParsedContext = (debugTarget: DebugTarget): UrlParsedContext => ({
  clientId: debugTarget.clientId,
  debugTarget,
  platform: debugTarget.platform,
});
