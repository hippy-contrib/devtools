declare namespace Adapter {
  type DomainListener = (msg: Adapter.CDP.Res) => void;
  declare namespace CDP {
    // 具体的协议体类型，中间件注册时从 tdf-devtools-protocol 中引入
    interface Req<T = any> {
      id: number;
      method: string;
      params: T;
      performance?: Performance;
    }

    interface EventRes<T = any> {
      method: string;
      params: T;
      performance?: Performance;
    }

    // CommanRes/ErrorRes 接口统一在 onMessage 时把 method 字段补充上去了
    interface CommandRes<T = any> {
      id: number;
      result: T;
      method: string;
      performance?: Performance;
    }

    interface ErrorRes {
      id: number;
      method: string;
      error: {
        code: number;
        message: string;
      };
      performance?: Performance;
    }

    type Res = EventRes | CommandRes | ErrorRes;
    type Data = Req | Res;
  }

  type Performance = {
    devtoolsToDebugServer: number;
    debugServerReceiveFromDevtools: number;
    debugServerToApp: number;
    appReceive: number;
    appResponse: number;
    debugServerReceiveFromApp: number;
    debugServerToDevtools: number;
    devtoolsReceive: number;
  };

  type Resolve = (value: Adapter.CDP.Res | PromiseLike<Adapter.CDP.Res>) => void;
  type Reject = (reason?: any) => void;

  type RequestPromiseMap = Map<
    string | number,
    {
      resolve: Resolve;
      reject: Reject;
    }
  >;
}
