import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { AppClientEvent, DevicePlatform, ErrorCode, MiddlewareType, WinstonColor } from '@/@types/enum';
import {
  defaultDownwardMiddleware,
  defaultUpwardMiddleware,
  UrlParsedContext,
  requestId,
  MiddleWareContext,
  MiddleWare,
  androidMiddleWareManager,
  iOSMiddleWareManager,
} from '@/middlewares';
import { CDP_DOMAIN_LIST, getDomain } from '@/utils/cdp';
import { Logger } from '@/utils/log';
import { composeMiddlewares } from '@/utils/middleware';
import { createCDPPerformance } from '@/utils/aegis';
import { config } from '@/config';

// ignore log the following method, because of frequency
const ignoreMethods = ['Page.screencastFrame', 'Page.screencastFrameAck'];
// const filteredLog = new Logger('filtered', WinstonColor.Yellow);
const downwardLog = new Logger('↓↓↓', WinstonColor.BrightRed);
const upwardLog = new Logger('↑↑↑', WinstonColor.BrightGreen);

export interface AppClient {
  on(event: AppClientEvent.Close, listener: () => void): this;
  on(event: AppClientEvent.Message, listener: (message: Adapter.CDP.Res) => void): this;
}

/**
 * app client message tunnel
 **/
export abstract class AppClient extends EventEmitter {
  public id: string;
  protected isClosed = false;
  protected platform: DevicePlatform;
  private urlParsedContext: UrlParsedContext;
  private cacheContext: Record<string, any> = {};
  private acceptDomains: string[] = CDP_DOMAIN_LIST;
  private ignoreDomains: string[] = [];
  private useAllDomain = true;
  private msgIdMap: Map<
    number,
    {
      method: string;
      // upward start ts, used to report adapter performance
      performance: Adapter.Performance;
    }
  > = new Map();
  private get middleWareManager() {
    return {
      [DevicePlatform.Android]: androidMiddleWareManager,
      [DevicePlatform.IOS]: iOSMiddleWareManager,
    }[this.platform];
  }

  public constructor(
    id,
    { useAllDomain = true, acceptDomains, ignoreDomains = [], urlParsedContext, platform }: AppClientOption,
  ) {
    super();
    this.id = id;
    this.useAllDomain = useAllDomain;
    this.acceptDomains = acceptDomains;
    this.ignoreDomains = ignoreDomains;
    this.urlParsedContext = urlParsedContext;
    this.platform = platform;
  }

  /**
   * 调试协议经过中间件的适配后，上行发送至 app 端
   */
  public sendToApp(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    if (!this.filter(msg)) {
      // filteredLog.info(`'${msg.method}' is filtered in app client type: ${this.constructor.name}`);
      return Promise.reject(ErrorCode.DomainFiltered);
    }

    const { id, method } = msg;
    this.msgIdMap.set(id, {
      method,
      performance: createCDPPerformance({
        ...(msg.performance || {}),
        debugServerReceiveFromDevtools: Date.now(),
      }),
    });
    const middlewareList = this.getMiddlewareList(MiddlewareType.Upward, method);
    return this.middlewareMessageHandler(middlewareList, msg);
  }

  public destroy() {}

  /**
   * 下行协议适配 handler
   */
  protected downwardMessageHandler(msg: Adapter.CDP.Res): Promise<Adapter.CDP.Res> {
    try {
      if ('id' in msg) {
        const cache = this.msgIdMap.get(msg.id);
        if (cache?.method) msg.method = cache.method;
      }

      const { method } = msg;
      const middlewareList = this.getMiddlewareList(MiddlewareType.Downward, method);
      return this.middlewareMessageHandler(middlewareList, msg);
    } catch (e) {
      downwardLog.error(`app client on message error: %s`, (e as Error)?.stack);
      return Promise.reject(e);
    }
  }

  /**
   * 通过中间件处理上下行消息
   */
  private middlewareMessageHandler(middlewareList: MiddleWare[], msgBeforeAdapter: Adapter.CDP.Res | Adapter.CDP.Req) {
    // 创建中间件上下文，中间件中可以通过调用 sendToApp, sendToDevtools 将调试协议分发到接收端
    const middlewareContext: MiddleWareContext = {
      ...this.urlParsedContext,
      ...this.cacheContext,
      msg: msgBeforeAdapter,
      sendToApp: (msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> => {
        if (!msg.id) {
          msg.id = requestId.create();
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { performance, ...msgWithoutPerf } = msg;
        if (!ignoreMethods.includes(msg.method))
          upwardLog.verbose('%s sendToApp %j', this.constructor.name, msgWithoutPerf);
        return this.sendHandler(msgWithoutPerf);
      },
      sendToDevtools: (msg: Adapter.CDP.Res) => {
        if (!ignoreMethods.includes(msg.method))
          downwardLog.verbose(
            '%s sendToDevtools %s %s %s',
            this.constructor.name,
            (msg as Adapter.CDP.CommandRes).id || '',
            msg.method,
            'error' in msg ? 'not support' : '',
          );
        let performance;
        if ('id' in msg) {
          const cache = this.msgIdMap.get(msg.id);
          performance = cache?.performance;
          if (performance) performance.debugServerToDevtools = Date.now();
        }
        if (config.showPerformance) msg.performance = performance;
        return this.emitMessageToDevtools(msg);
      },
      setContext: (key: string, value: unknown) => {
        this.cacheContext[key] = value;
      }
    };
    return composeMiddlewares(middlewareList)(middlewareContext);
  }

  /**
   * 协议下行发送至 devtools 端
   */
  private emitMessageToDevtools(msg: Adapter.CDP.Res) {
    if (!msg) return Promise.reject(ErrorCode.EmptyCommand);
    this.emit(AppClientEvent.Message, msg);

    if ('id' in msg) {
      this.msgIdMap.delete(msg.id);
    }

    return Promise.resolve(msg);
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

  /**
   * 根据调试协议查询注册的中间件列表
   */
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

  /**
   * AppClient 子类收到消息后，需调用父类的 downwardMessageHandler
   */
  protected abstract registerMessageListener(): void;
}

export type AppClientOption = {
  useAllDomain: boolean;
  acceptDomains?: string[];
  ignoreDomains?: string[];
  ws?: WebSocket;
  iWDPWsUrl?: string;
  urlParsedContext: UrlParsedContext;
  platform: DevicePlatform;
};
