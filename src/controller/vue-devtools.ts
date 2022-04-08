import WebSocket from 'ws';
import { WinstonColor, ReportEvent, ClientRole } from '@/@types/enum';
import { JSRuntimeWsUrlParams, DevtoolsWsUrlParams } from '@/utils/url';
import { Logger } from '@/utils/log';
import { createVueDevtoolsChannel } from '@/utils/pub-sub-channel';
import { getDBOperator } from '@/db';
import { aegis } from '@/utils/aegis';

const log = new Logger('vue-devtools', WinstonColor.Yellow);

export const onVueClientConnection = async (ws: WebSocket, wsUrlParams: JSRuntimeWsUrlParams | DevtoolsWsUrlParams) => {
  const { contextName, clientRole, clientId } = wsUrlParams;
  log.info('%s connected, clientId: %s', clientRole, clientId);
  const { Subscriber, Publisher } = getDBOperator();
  aegis.reportEvent({
    name: ReportEvent.VueDevtools,
    ext1: clientId,
    ext2: contextName,
  });

  const channel = createVueDevtoolsChannel(clientId);
  const publisher = new Publisher(channel);
  const subscriber = new Subscriber(channel);
  const handler = (msg) => {
    log.verbose('receive %s message: %s', clientRole, msg);
    ws.send(msg.toString());
  };
  subscriber.subscribe(handler);

  if (clientRole === ClientRole.JSRuntime) publisher.publish(JSON.stringify([VueDevtoolsEvent.BackendDisconnect]));

  ws.on('message', async (msg) => {
    const msgStr = msg.toString();
    if (msgStr) publisher.publish(msgStr);
  });

  ws.on('close', (code, reason) => {
    log.warn('%s ws closed, code: %s, reason: %s', clientRole, code, reason);
    subscriber.unsubscribe(handler);
    subscriber.disconnect();
    if (reason.indexOf('client') !== -1) {
      publisher.publish(JSON.stringify([VueDevtoolsEvent.DevtoolsDisconnect]));
    }
  });
  ws.on('error', (e) => log.error('JSRuntime ws error: %s', e.stack || e));
};

export const enum VueDevtoolsEvent {
  BackendDisconnect = 'vue-devtools-disconnect-backend',
  DevtoolsDisconnect = 'vue-devtools-disconnect-devtools',
}
