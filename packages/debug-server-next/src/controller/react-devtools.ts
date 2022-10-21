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

import WebSocket from 'ws';
import { WinstonColor, ReportEvent, ClientRole } from '@debug-server-next/@types/enum';
import { JSRuntimeWsUrlParams, DevtoolsWsUrlParams } from '@debug-server-next/utils/url';
import { Logger } from '@debug-server-next/utils/log';
import { createReactDevtoolsChannel } from '@debug-server-next/utils/pub-sub-channel';
import { getDBOperator } from '@debug-server-next/db';
import { report } from '@debug-server-next/utils/report';

const log = new Logger('react-devtools', WinstonColor.Yellow);

/**
 * Pub/Sub react devtools msg
 */
export const onReactClientConnection = async (
  ws: WebSocket,
  wsUrlParams: JSRuntimeWsUrlParams | DevtoolsWsUrlParams,
) => {
  const { contextName, clientRole, clientId } = wsUrlParams;
  log.info('%s connected', clientRole);
  const { Subscriber, Publisher } = getDBOperator();
  report.event({
    name: ReportEvent.ReactDevtools,
    ext1: clientId,
    ext2: contextName,
  });

  const downChannel = createReactDevtoolsChannel(clientId, 'down');
  const upChannel = createReactDevtoolsChannel(clientId, 'up');
  let publisher;
  let subscriber;
  if (clientRole === ClientRole.ReactJSRuntime) {
    publisher = new Publisher(downChannel);
    subscriber = new Subscriber(upChannel);
  } else {
    publisher = new Publisher(upChannel);
    subscriber = new Subscriber(downChannel);
  }

  const handler = (msg) => {
    ws.send(msg.toString());
  };
  subscriber.subscribe(handler);

  /**
   * dispatch event when connection
   *  1. backend connect: reload frontend UI, ignore previous devtools instance
   *  2. frontend connect: activate backend, start dispatch debug protocol
   */
  publisher.publish({
    event:
      clientRole === ClientRole.ReactJSRuntime ? ReactDevtoolsEvent.BackendConnect : ReactDevtoolsEvent.FrontendConnect,
  });

  ws.on('message', async (msg) => {
    const msgStr = msg.toString();
    if (msgStr) publisher.publish(msgStr);
  });

  ws.on('close', (code, reason) => {
    log.info('%s closed. code: %s, reason: %s', clientRole, code, reason);
    subscriber.disconnect();
    publisher.disconnect();
  });
  ws.on('error', (e) => log.error('JSRuntime ws error: %s', e.stack || e));
};

export const enum ReactDevtoolsEvent {
  BackendConnect = 'react-devtools-connect-backend',
  FrontendConnect = 'react-devtools-connect-frontend',
}
