export interface IPublisher {
  publish(message: string | Adapter.CDP.Req): void;
  disconnect(): void;
}

export interface ISubscriber {
  subscribe(cb: SubCallback): void;
  pSubscribe(cb: PSubCallback): void;
  unsubscribe(cb?: SubCallback): void;
  pUnsubscribe(cb?: PSubCallback): void;
  disconnect(): void;
}

type SubCallback = (message: string | Adapter.CDP.Res) => void;
type PSubCallback = (message: string, channel: string) => void;
