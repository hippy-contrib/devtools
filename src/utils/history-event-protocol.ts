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

/**
 * cache all history event to redis to support for history protocol for iOS, android V8 support history log natively.
 *
 * if devtools had not attached, cache all history logs to redis,
 * clean cached data when app disconnect,
 * consume by re-Pub all history logs when devtools connect, in this case will broadcast to
 * all connected devtools, so some devtools client maybe receive log twice.
 */

import { ChromeEvent, IOS100Event } from '@hippy/devtools-protocol/dist/types';
import { getDBOperator } from '@debug-server-next/db';
import { config } from '@debug-server-next/config';
import { DevicePlatform } from '@debug-server-next/@types/enum';

const getHistoryKey = (clientId: string) => `${config.redis.logTablePrefix}${clientId}`;

/**
 * cache log, network event when devtools have not opened,
 * those protocol is dispatched in app create lifecycle
 */
export const isHistoryProtocol = (method: string, platform: DevicePlatform) => {
  if (
    platform === DevicePlatform.IOS &&
    [ChromeEvent.RuntimeConsoleAPICalled, ChromeEvent.LogEntryAdded, IOS100Event.ConsoleMessageAdded].includes(method)
  )
    return true;
  if (method?.startsWith('Network.')) return true;
  return false;
};

export const saveHistoryProtocol = async (clientId: string, msg: string) => {
  const { DB } = getDBOperator();
  const db = new DB<string>(getHistoryKey(clientId));
  await db.rPush(msg);
};

export const clearHistoryProtocol = async (clientId: string) => {
  const { DB } = getDBOperator();
  const db = new DB<string>(getHistoryKey(clientId));
  await db.clearList();
};

export const getHistoryProtocol = async (clientId: string) => {
  const { DB } = getDBOperator();
  const db = new DB<string>(getHistoryKey(clientId));
  return await db.getList();
};
