/**
 * cache all logs to redis to support for history log for iOS, android V8 support history log natively.
 *
 * if devtools had not attached, cache all history logs to redis,
 * clean cached data when app disconnect,
 * consume by re-Pub all history logs when devtools connect, in this case will broadcast to
 * all connected devtools, so some devtools client maybe receive log twice.
 */

import { ChromeEvent, IOS100Event } from 'tdf-devtools-protocol/dist/types';
import { getDBOperator } from '@/db';
import { config } from '@/config';

const getLogKey = (clientId: string) => `${config.redis.logTablePrefix}${clientId}`;

export const isLogProtocol = (method: string) =>
  [ChromeEvent.RuntimeConsoleAPICalled, ChromeEvent.LogEntryAdded, IOS100Event.ConsoleMessageAdded].includes(method);

export const saveLogProtocol = async (clientId: string, msg: string) => {
  const { DB } = getDBOperator();
  const db = new DB<string>(getLogKey(clientId));
  await db.rPush(msg);
};

export const clearLogProtocol = async (clientId: string) => {
  const { DB } = getDBOperator();
  const db = new DB<string>(getLogKey(clientId));
  await db.clearList();
};

export const getHistoryLogProtocol = async (clientId: string) => {
  const { DB } = getDBOperator();
  const db = new DB<string>(getLogKey(clientId));
  return await db.getList();
};
