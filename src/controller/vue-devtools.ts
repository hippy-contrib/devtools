import WebSocket from 'ws';
import { TdfEvent } from 'tdf-devtools-protocol/dist/types/enum-tdf-mapping';
import { WinstonColor, ReportEvent, ClientRole, InternalChannelEvent } from '@/@types/enum';
import { JSRuntimeWsUrlParams, DevtoolsWsUrlParams } from '@/utils/url';
import { Logger } from '@/utils/log';
import { createVueDevtoolsChannel, createInternalChannel } from '@/utils/pub-sub-channel';
import { getDBOperator } from '@/db';
import { aegis } from '@/utils/aegis';
import { publishRes } from '@/utils/reload-adapter';
import { DebugTargetManager } from '@/controller/debug-targets';

const log = new Logger('vue-devtools', WinstonColor.Yellow);

export const onVueClientConnection = async (ws: WebSocket, wsUrlParams: JSRuntimeWsUrlParams | DevtoolsWsUrlParams) => {
  const { contextName, clientRole, clientId } = wsUrlParams;
  log.verbose('%s connected, clientId: %s', clientRole, clientId);
  const { Subscriber, Publisher } = getDBOperator();
  aegis.reportEvent({
    name: ReportEvent.VueDevtools,
    ext1: clientId,
    ext2: contextName,
  });

  let internalHandler;
  let internalSubscriber;
  if (clientRole === ClientRole.JSRuntime) {
    const internalChannelId = createInternalChannel(clientId, '');
    internalSubscriber = new Subscriber(internalChannelId);
    internalHandler = (msg) => {
      if (msg === InternalChannelEvent.DevtoolsConnected) {
        // pub enable after devtools connected
        pubEnableVueDevtools();
      }
    };
    internalSubscriber.subscribe(internalHandler);
    // pub enable immediately, support for reload instance
    pubEnableVueDevtools();

    async function pubEnableVueDevtools() {
      const debugTarget = await DebugTargetManager.findDebugTarget(clientId, undefined, true);
      publishRes(clientId, {
        method: TdfEvent.TDFRuntimeEnableVueDevtools,
        params: {
          contextName: debugTarget?.title,
        },
      });
    }
  }

  const channel = createVueDevtoolsChannel(clientId);
  const publisher = new Publisher(channel);
  const subscriber = new Subscriber(channel);
  const handler = (msg) => {
    log.debug('receive %s message: %s', clientRole, msg);
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
    if (clientRole === ClientRole.JSRuntime) {
      internalSubscriber.unsubscribe(internalHandler);
      internalSubscriber.disconnect();
    }
  });
  ws.on('error', (e) => log.error('JSRuntime ws error: %s', e.stack || e));
};

export const enum VueDevtoolsEvent {
  BackendDisconnect = 'vue-devtools-disconnect-backend',
  DevtoolsDisconnect = 'vue-devtools-disconnect-devtools',
}
