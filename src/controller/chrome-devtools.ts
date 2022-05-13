import { aegis } from '@/utils/aegis';
import {
  AppClientType,
  ClientRole,
  DevicePlatform,
  InternalChannelEvent,
  WinstonColor,
  WSCode,
  ReportEvent,
} from '@/@types/enum';
import { getDBOperator } from '@/db';
import { appClientManager } from '@/client';
import { subscribeCommand, cleanDebugTarget } from '@/controller/pub-sub-manager';
import { Logger } from '@/utils/log';
import { createDownwardChannel, createUpwardChannel, createInternalChannel } from '@/utils/pub-sub-channel';
import { AppWsUrlParams, DevtoolsWsUrlParams } from '@/utils/url';
import { createTargetByWsUrlParams, patchRefAndSave } from '@/utils/debug-target';
import { MyWebSocket } from '@/@types/socker-server';
import { publishReloadCommand, resumeCommands } from '@/utils/reload-adapter';
import { clearLogProtocol } from '@/utils/log-protocol';

const log = new Logger('chrome-devtools', WinstonColor.Cyan);

/**
 * pipe devtools ws message to redis pub/sub
 */
export const onDevtoolsConnection = (ws: MyWebSocket, wsUrlParams: DevtoolsWsUrlParams) => {
  const { Subscriber, Publisher } = getDBOperator();
  const { extensionName, clientId } = wsUrlParams;
  const downwardChannelId = createDownwardChannel(clientId, extensionName);
  const upwardChannelId = createUpwardChannel(clientId, extensionName);
  const internalChannelId = createInternalChannel(clientId, '');
  log.verbose('devtools connected, subscribe channel: %s, publish channel: %s', downwardChannelId, upwardChannelId);

  const downwardSubscriber = new Subscriber(downwardChannelId);
  // internal channel used to listen message between nodes, such as when app ws closed, notify devtools ws close
  const internalSubscriber = new Subscriber(internalChannelId);
  const internalPublisher = new Publisher(internalChannelId);
  const publisher = new Publisher(upwardChannelId);
  const downwardHandler = (msg) => {
    ws.send(msg);
    try {
      const msgStr = msg as string;
      const msgObj = JSON.parse(msgStr as string);
      const { ts: start } = msgObj;
      if (start) {
        aegis.reportTime({
          name: ReportEvent.PubSub,
          duration: Date.now() - start,
          ext1: `${Math.ceil(msgStr.length / 1024)}KB`,
          ext2: msgObj.method,
        });
      }
    } catch (e) {
      log.error('%s channel message are invalid JSON, %s', downwardChannelId, msg);
    }
  };

  const internalHandler = (msg) => {
    if (msg === InternalChannelEvent.AppWSClose) {
      log.warn('close devtools ws connection');
      ws.close(WSCode.ClosePage, 'the target page is closed');
      internalSubscriber.unsubscribe(internalHandler);
      internalSubscriber.disconnect();
    }
  };
  downwardSubscriber.subscribe(downwardHandler);
  internalSubscriber.subscribe(internalHandler);
  internalPublisher.publish(InternalChannelEvent.DevtoolsConnected);

  // for iOS, must invoke Debugger.disable before devtools frontend connected, otherwise couldn't
  // receive Debugger.scriptParsed event.
  // for Android, both way is okay
  resumeCommands.map(publisher.publish.bind(publisher));

  ws.on('message', (msg) => {
    publisher.publish(msg.toString());
  });
  ws.on('close', (code, reason) => {
    log.warn('devtools ws client close code %s, reason: %s, clientId: %s', code, reason, clientId);
    resumeCommands.map(publisher.publish.bind(publisher));
    // wait for publish finished
    process.nextTick(() => {
      publisher.disconnect();
      downwardSubscriber.unsubscribe(downwardHandler);
      downwardSubscriber.disconnect();
    });
  });
  ws.on('error', (e) => log.error('devtools ws client error: %j', e));
};

export const onAppConnection = async (ws: MyWebSocket, wsUrlParams: AppWsUrlParams, host: string) => {
  const { clientId, clientRole } = wsUrlParams;
  log.verbose('WSAppClient connected. %s', clientId);
  const platform = {
    [ClientRole.Android]: DevicePlatform.Android,
    [ClientRole.IOS]: DevicePlatform.IOS,
  }[clientRole];
  const useWS = appClientManager.shouldUseAppClientType(platform, AppClientType.WS);
  if (!useWS) return log.warn('current env is %s, ignore ws connection', global.debugAppArgv.env);

  let debugTarget = createTargetByWsUrlParams(wsUrlParams, host);
  debugTarget = await patchRefAndSave(debugTarget);
  process.nextTick(() => {
    subscribeCommand(debugTarget, ws);
  });

  // when reload, iOS will create a new JSContext, so the debug protocol should resend
  if (debugTarget.platform === DevicePlatform.IOS) publishReloadCommand(debugTarget);

  ws.on('close', (code: number, reason: string) => {
    log.warn('WSAppClient closed: %j, reason: %s, clientId: %s', code, reason, clientId);
    clearLogProtocol(clientId);
    // when reload page, keep frontend open to debug lifecycle of created
    const closeDevtools = code === WSCode.ClosePage;
    cleanDebugTarget(clientId, closeDevtools);
  });
  ws.on('error', (e) => log.error('WSAppClient error %j', e));
};
