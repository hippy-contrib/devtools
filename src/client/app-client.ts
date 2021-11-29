import WebSocket from 'ws';
import { AppClientType, ClientEvent, DevicePlatform, ErrorCode, MiddlewareType, WinstonColor } from '@/@types/enum';
import {
  defaultDownwardMiddleware,
  defaultUpwardMiddleware,
  MiddleWareManager,
  UrlParsedContext,
  requestId,
  MiddleWareContext,
} from '@/middlewares';
import { CDP_DOMAIN_LIST, getDomain, DomainRegister } from '@/utils/cdp';
import { Logger } from '@/utils/log';
import { composeMiddlewares } from '@/utils/middleware';

const filteredLog = new Logger('filtered', WinstonColor.Yellow);
const downwardLog = new Logger('↓↓↓', WinstonColor.Red);
const upwardLog = new Logger('↑↑↑', WinstonColor.Green);

/**
 * app client 通道，负责调试协议至 app 端的收发。目前包括三个通道：
 *    - tunnel 通道：c++ addon 实现
 *    - ws 通道：手Q采用此通道
 *    - IWDP 通道：TDF iOS 采用此通道
 *
 * 对外接口：
 *  on:
 *      message       : app response
 *      close         : app 断连后触发，需通知 devtools 也断连
 *  sendToApp         : send command to app
 **/
export abstract class AppClient extends DomainRegister {
  public id: string;
  public type: AppClientType;
  protected isClosed = false;
  protected platform: DevicePlatform;
  private middleWareManager: MiddleWareManager;
  private urlParsedContext: UrlParsedContext;
  private acceptDomains: string[] = CDP_DOMAIN_LIST;
  private ignoreDomains: string[] = [];
  private useAllDomain = true;
  private msgIdMethodMap: Map<number, string> = new Map();

  public constructor(
    id,
    {
      useAllDomain = true,
      acceptDomains,
      ignoreDomains = [],
      middleWareManager,
      urlParsedContext,
      platform,
    }: AppClientOption,
  ) {
    super();
    this.id = id;
    this.useAllDomain = useAllDomain;
    this.acceptDomains = acceptDomains;
    this.ignoreDomains = ignoreDomains;
    this.middleWareManager = middleWareManager;
    this.urlParsedContext = urlParsedContext;
    this.platform = platform;
  }

  /**
   * 调试协议上行发送至 app 端
   */
  public sendToApp(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    if (!this.filter(msg)) {
      filteredLog.info(`'${msg.method}' is filtered in app client type: ${this.type}`);
      return Promise.reject(ErrorCode.DomainFiltered);
    }

    const { method } = msg;
    this.msgIdMethodMap.set(msg.id, msg.method);
    const middlewareList = this.getMiddlewareList(MiddlewareType.Upward, method);
    // upwardLog.info(`'${msg.method}' middlewareLength: ${middlewareList.length}`);
    // 上行的具体协议交给中间件适配，然后分发到 app 端
    return composeMiddlewares(middlewareList)(this.makeContext(msg));
  }

  /**
   * 监听 app 端的调试协议，经过中间件适配后，发送至 devtools 端
   */
  protected onMessage(msg: Adapter.CDP.Res): Promise<Adapter.CDP.Res> {
    try {
      if ('id' in msg) {
        const method = this.msgIdMethodMap.get(msg.id);
        if (method) msg.method = method;
        this.msgIdMethodMap.delete(msg.id);
      }

      const { method } = msg;
      const middlewareList = this.getMiddlewareList(MiddlewareType.Downward, method);
      return composeMiddlewares(middlewareList)(this.makeContext(msg));
    } catch (e) {
      downwardLog.error(`app client on message error: %s`, (e as Error)?.stack);
      return Promise.reject(e);
    }
  }

  private sendToDevtools(msg: Adapter.CDP.Res) {
    if (!msg) return Promise.reject(ErrorCode.EmptyCommand);
    this.emit(ClientEvent.Message, msg);
    return Promise.resolve(msg);
  }

  /**
   * 创建中间件上下文，中间件中通过调用 sendToApp, sendToDevtools 将调试协议分发到接收端
   */
  private makeContext(msg: Adapter.CDP.Req | Adapter.CDP.Res): MiddleWareContext {
    return {
      ...this.urlParsedContext,
      msg,
      sendToApp: (msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> => {
        if (!msg.id) {
          msg.id = requestId.create();
        }
        upwardLog.info('%s sendToApp %j', this.type, msg);
        return this.sendHandler(msg);
      },
      sendToDevtools: (msg: Adapter.CDP.Res) => {
        downwardLog.info('%s sendToDevtools %s %s', this.type, (msg as Adapter.CDP.CommandRes).id || '', msg.method);
        return this.sendToDevtools(msg);
      },
    };
  }

  /**
   * 上行协议 filter，通过才放行
   */
  private filter(msg: Adapter.CDP.Req) {
    if (this.useAllDomain) return true;
    const { method } = msg;
    const domain = getDomain(method);

    if (this.ignoreDomains.length) {
      const isIgnoreDomain = this.ignoreDomains.indexOf(domain) !== -1 || this.ignoreDomains.indexOf(method) !== -1;
      return !isIgnoreDomain;
    }
    const isAcceptDomain = this.acceptDomains.indexOf(domain) !== -1 || this.acceptDomains.indexOf(method) !== -1;
    return isAcceptDomain;
  }

  private getMiddlewareList(type: MiddlewareType, method: string) {
    let middlewareList = {
      [MiddlewareType.Upward]: this.middleWareManager.upwardMiddleWareListMap,
      [MiddlewareType.Downward]: this.middleWareManager.downwardMiddleWareListMap,
    }[type][method];
    if (!middlewareList) middlewareList = [];
    if (!Array.isArray(middlewareList)) middlewareList = [middlewareList];
    return [...middlewareList, type === MiddlewareType.Upward ? defaultUpwardMiddleware : defaultDownwardMiddleware];
  }

  /**
   * 每个通道的消息发送方式不同，需要子类实现实现
   */
  protected abstract sendHandler(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res>;
  protected abstract registerMessageListener(): void;
}

export type AppClientOption = {
  useAllDomain: boolean;
  acceptDomains?: string[];
  ignoreDomains?: string[];
  ws?: WebSocket;
  iWDPWsUrl?: string;
  middleWareManager: MiddleWareManager;
  urlParsedContext: UrlParsedContext;
  platform: DevicePlatform;
};
