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
import colors from 'colors/safe';
import {
  WinstonColor,
  ReportEvent,
  InternalChannelEvent,
  DevicePlatform,
  AppClientType,
} from '@debug-server-next/@types/enum';
import { VanillaJSRuntimeWsUrlParams } from '@debug-server-next/utils/url';
import { Logger } from '@debug-server-next/utils/log';
import {
  createUpwardChannel,
  createDownwardChannel,
  createInternalChannel,
} from '@debug-server-next/utils/pub-sub-channel';
import { getDBOperator } from '@debug-server-next/db';
import { report } from '@debug-server-next/utils/report';
import { DebugTargetManager } from '@debug-server-next/controller/debug-targets';
import { GlobalId } from '@debug-server-next/utils/global-id';
import { sleep } from '@debug-server-next/utils/timer';
import {
  saveHistoryProtocol,
  isHistoryProtocol,
  getHistoryProtocol,
  clearHistoryProtocol,
} from '@debug-server-next/utils/history-event-protocol';
import { DebugTarget } from '@debug-server-next/@types/debug-target';
import { VANILLA_JS_METHODS, LOG_PROTOCOLS } from '@debug-server-next/@types/constants';

const label = colors.yellow('vanilla-js-devtools');
const downwardLog = new Logger(`↓↓↓ ${label}`, WinstonColor.BrightRed);
const upwardLog = new Logger(`↑↑↑ ${label}`, WinstonColor.BrightGreen);
const log = new Logger(label);

const ENABLE_LOG_PROTOCOL = 'Runtime.enable';
const ENABLE_PROTOCOLS = ['Network.enable', 'DOMStorage.enable'];
// const LOG_EVENT = 'Runtime.consoleAPICalled';

/**
 * Pub/Sub vanilla js devtools msg
 */
export const onVanillaJSClientConnection = async (ws: WebSocket, wsUrlParams: VanillaJSRuntimeWsUrlParams) => {
  const protocolId = new GlobalId(-20000, -1);
  const { contextName, clientRole, clientId, platform } = wsUrlParams;
  log.info('%s connected', clientRole);
  const { Subscriber, Publisher } = getDBOperator();

  const internalChannelId = createInternalChannel(clientId, '');
  const internalSubscriber = new Subscriber(internalChannelId);
  internalSubscriber.subscribe((msg) => {
    if (msg === InternalChannelEvent.DevtoolsConnected) {
      // pub enable after devtools connected
      triggerEnableLogForIOS(ws, protocolId, clientId);
      broadcastHistoryLog(clientId, downPublisher, platform);
    }
  });
  // pub enable immediately, support for reload scene
  triggerEnableLogForIOS(ws, protocolId, clientId);
  triggerEnableNetworkAndStorage(ws, protocolId);

  const upwardChannelId = createUpwardChannel(clientId, '*');
  const downwardChannelId = createDownwardChannel(clientId);
  const downPublisher = new Publisher(downwardChannelId);
  const upSubscriber = new Subscriber(upwardChannelId);

  upSubscriber.pSubscribe((msg) => {
    try {
      const msgStr = msg.toString();
      const msgObj = JSON.parse(msgStr);
      if (LOG_PROTOCOLS.includes(msgObj.method)) {
        if (!(ws as any).enableLogForIOS) return;
        upwardLog.verbose('sendToApp %j', msgObj);
        report.event({
          name: ReportEvent.VanillaIOSJSRuntime,
          ext1: contextName,
          ext2: msgObj.method,
        });
        return ws.send(msgStr);
      }
      if (VANILLA_JS_METHODS.includes(msgObj.method)) {
        upwardLog.verbose('sendToApp %j', msgObj);
        ws.send(msgStr);
        report.event({
          name: ReportEvent.VanillaJSRuntime,
          ext1: contextName,
          ext2: msgObj.method,
        });
      }
    } catch (e) {}
  });

  let debugTarget: DebugTarget;
  ws.on('message', async (msg) => {
    const msgStr = msg.toString();
    if (!msgStr) return;
    try {
      const cmd: Adapter.CDP.CommandRes = JSON.parse(msgStr);
      // network event dispatch from history cache
      // if (!cmd.method?.startsWith('Network.')) {
      downPublisher.publish(msgStr);
      downwardLog.verbose('sendToDevtools %s %s %s', cmd.id || '', cmd.method, 'error' in cmd ? 'not support' : '');
      // }

      if (!debugTarget) {
        await sleep(800);
        debugTarget = await DebugTargetManager.findDebugTarget(clientId, undefined, true);
      }
      if (cmd.method && debugTarget && isHistoryProtocol(cmd.method, debugTarget.platform)) {
        saveHistoryProtocol(clientId, msgStr);
      }
    } catch (e) {
      log.error('parse json error: %s', (e as Error)?.stack || e);
    }
  });

  ws.on('close', async (code, reason) => {
    log.info('%s closed. code: %s, reason: %s', clientRole, code, reason);
    clearHistoryProtocol(clientId);
    await upSubscriber.disconnect();
    await downPublisher.disconnect();
    await internalSubscriber.disconnect();
  });
  ws.on('error', (e) => log.error('vanilla js ws error: %s', e.stack || e));
};

async function enableLogForIOS(clientId) {
  /**
   * app ws maybe late connect than vanilla js, so maybe could not find debugTarget
   */
  await sleep(800);
  const debugTarget = await DebugTargetManager.findDebugTarget(clientId, undefined, true);
  if (!debugTarget) return true;
  return debugTarget.platform === DevicePlatform.IOS && !debugTarget.appClientTypeList.includes(AppClientType.IWDP);
}

/**
 * if iOS device not use IWDP, enable log protocol by vanilla js
 */
async function triggerEnableLogForIOS(ws, protocolId, clientId) {
  const enabled = await enableLogForIOS(clientId);
  ws.enableLogForIOS = enabled;
  if (enabled) {
    const event = {
      id: protocolId.create(),
      method: ENABLE_LOG_PROTOCOL,
      params: {},
    };
    ws.send(JSON.stringify(event));
    upwardLog.verbose('sendToApp %j', event);
  }
}

async function triggerEnableNetworkAndStorage(ws, protocolId) {
  // enable sample data when connected
  ENABLE_PROTOCOLS.forEach((protocol) => {
    const event = {
      id: protocolId.create(),
      method: protocol,
      params: {},
    };
    ws.send(JSON.stringify(event));
    upwardLog.verbose('sendToApp %j', event);
  });
}

const broadcastHistoryLog = async (clientId, downPublisher, platform: DevicePlatform) => {
  const list = await getHistoryProtocol(clientId);
  if (!list.length) return;

  /**
   * delay to send history log after ConsoleModel of devtools is ready
   */
  setTimeout(async () => {
    /**
     * mock a clear protocol to clear existed history logs in console panel
     */
    if (platform === DevicePlatform.IOS)
      await downPublisher.publish({
        method: 'Log.cleared',
        params: {},
      });

    await list.map(downPublisher.publish.bind(downPublisher));
  }, 1500);
};
