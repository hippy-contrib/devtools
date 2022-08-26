/*
 * Tencent is pleased to support the open source community by making
 * Hippy available.
 *
 * Copyright (C) 2017-2019 THL A29 Limited, a Tencent company.
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { report } from '@debug-server-next/utils/report';
import {
  AppClientType,
  ClientRole,
  DevicePlatform,
  InternalChannelEvent,
  WinstonColor,
  WSCode,
  ReportEvent,
} from '@debug-server-next/@types/enum';
import { getDBOperator } from '@debug-server-next/db';
import { appClientManager } from '@debug-server-next/client';
import { subscribeCommand, cleanDebugTarget } from '@debug-server-next/controller/pub-sub-manager';
import { Logger } from '@debug-server-next/utils/log';
import { DebugTarget } from '@debug-server-next/@types/debug-target';
import {
  createDownwardChannel,
  createUpwardChannel,
  createInternalChannel,
} from '@debug-server-next/utils/pub-sub-channel';
import { AppWsUrlParams, DevtoolsWsUrlParams } from '@debug-server-next/utils/url';
import { MyWebSocket } from '@debug-server-next/@types/socker-server';
import { publishReloadCommand, resumeCommands } from '@debug-server-next/utils/reload-adapter';
import { clearHistoryProtocol } from '@debug-server-next/utils/history-event-protocol';

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
  report.event({
    name: ReportEvent.ConnectFrontend,
    ext1: clientId,
  });
  const connectTime = Date.now();
  log.info('devtools connected');
  log.verbose('subscribe channel: %s, publish channel: %s', downwardChannelId, upwardChannelId);

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
        report.time(Date.now() - start, {
          name: ReportEvent.PubSub,
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
      log.verbose('close devtools ws connection');
      ws.close(WSCode.ClosePage, 'the target page is closed');
      internalSubscriber.disconnect();
      internalPublisher.disconnect();
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
  ws.on('close', async (code, reason) => {
    log.info('devtools closed. code: %s, reason: %s', code, reason);
    await Promise.all(resumeCommands.map(publisher.publish.bind(publisher)));
    // wait for publish finished
    publisher.disconnect();
    downwardSubscriber.disconnect();
    internalSubscriber.disconnect();
    internalPublisher.disconnect();
    report.event({
      name: ReportEvent.DisConnectFrontend,
      ext1: String(code),
      ext2: String(Date.now() - connectTime),
    });
  });
  ws.on('error', (e) => log.error('devtools ws client error: %j', e));
};

export const onAppConnection = async (ws: MyWebSocket, wsUrlParams: AppWsUrlParams, debugTarget: DebugTarget) => {
  const { clientId, clientRole, contextName } = wsUrlParams;
  log.info('app connected. %s', contextName);
  const platform = {
    [ClientRole.Android]: DevicePlatform.Android,
    [ClientRole.IOS]: DevicePlatform.IOS,
  }[clientRole];
  const useWS = appClientManager.shouldUseAppClientType(platform, AppClientType.WS);
  if (!useWS) return log.verbose('current env is %s, ignore ws connection', global.debugAppArgv.env);

  subscribeCommand(debugTarget, ws);

  report.event({
    name: ReportEvent.RemoteDebug,
    ext1: contextName,
    ext2: platform,
  });

  // when reload, iOS will create a new JSContext, so the debug protocol should resend
  if (debugTarget.platform === DevicePlatform.IOS) publishReloadCommand(debugTarget);
  const connectTime = Date.now();
  ws.on('close', (code: number, reason: string) => {
    log.info('app closed. code: %j, reason: %s, contextName: %s', code, reason, contextName);
    clearHistoryProtocol(clientId);
    // when reload page, keep frontend open to debug lifecycle of created
    const closeDevtools = code === WSCode.ClosePage;
    cleanDebugTarget(clientId, closeDevtools);
    report.event({
      name: ReportEvent.DisRemoteDebug,
      ext1: String(code),
      ext2: String(Date.now() - connectTime),
    });
  });
  ws.on('error', (e) => log.error('WSAppClient error %j', e));
};
