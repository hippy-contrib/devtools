import { log } from './log';

let retries = 0
const maxRetries = 10
const noop = () => {}
const prefix = '[vanilla js devtools]'

export const socketWithRetry = (url: string, handlers: SocketHandlers) => {
  const {
    onOpen = noop,
    onClose = noop,
    onMessage = noop,
  } = handlers
  // @ts-ignore - last argv set ignore devtools monitor
  let client = new WebSocket(url, undefined, {}, true);
  client.onopen = onOpen

  client.onclose = (reason) => {
    if (retries === 0) onClose(reason as unknown as string)
    log.warn(prefix, reason)
    client = undefined
    // After 10 retries stop trying, to prevent logspam.
    if (retries < maxRetries) {
      const retryInMs = 1000 * Math.pow(2, retries) + Math.random() * 100
      retries += 1
      log.warn(prefix, 'Trying to reconnect...')
      setTimeout(() => {
        client = socketWithRetry(url, handlers)
      }, retryInMs)
    }
  }

  client.onmessage = (data) => {
    retries = 0
    onMessage(data)
  }

  client.send = new Proxy(client.send, {
    apply: (target, thisArg, argumentsList: Parameters<typeof client.send>) => {
      if (!client) return
      return target.apply(thisArg, argumentsList)
    },
  })

  client.close = new Proxy(client.close, {
    apply: (target, thisArg, argumentsList: Parameters<typeof client.close>) => {
      if (!client) return
      return target.apply(thisArg, argumentsList)
    },
  })

  return client
}

export interface SocketHandlers {
  onOpen?: () => void
  onClose?: (reason: string) => void
  onMessage?: (data: any) => void
}
