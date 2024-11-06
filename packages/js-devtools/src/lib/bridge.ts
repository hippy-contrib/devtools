import { parseURL, getWSProtocolByHttpProtocol, makeUrl } from './url';
import { socketWithRetry, SocketHandlers } from './ws';
import { log } from './log'

export const createBridge = (handlers: SocketHandlers) => {
  // __resourceQuery is entry query string, webpack will inject this variable
  const parsedResourceQuery: any = parseURL(__resourceQuery)
  const protocol = getWSProtocolByHttpProtocol(parsedResourceQuery.protocol || 'http')
  const host = parsedResourceQuery.host || 'localhost'
  const port = parsedResourceQuery.port || 38989
  let clientId
  try {
    // @ts-ignore
    clientId = global.__HIPPYNATIVEGLOBAL__.Debug.debugClientId
  } catch (e) {
    log.warn('get devtools clientId failed, please update hippy sdk to ^2.13.4')
  }

  const url = makeUrl(`${protocol}://${host}:${port}/debugger-proxy`, {
    role: 'vanilla_js_runtime',
    contextName: 'contextName',
    clientId,
    // @ts-ignore
    platform: global?.Hippy?.device?.platform?.OS === 'ios' ? DevicePlatform.IOS : DevicePlatform.Android,
  })

  const socket = socketWithRetry(url, handlers)
  return socket;
}

enum DevicePlatform {
  Unknown = '0',
  IOS = '1',
  Android = '2',
}