import { TdfEvent } from 'tdf-devtools-protocol/dist/types/enum-tdf-mapping';
import { blue, black } from 'colors/safe';
import { ChromeEvent } from 'tdf-devtools-protocol/dist/types/enum-chrome-mapping';
import { Logger } from '@/utils/log';
import { MiddleWareManager } from '../middleware-context';

const log = new Logger('tdf-log-middleware');

export const tdfLogMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [TdfEvent.TDFLogGetLog]: async (ctx) => {
      const eventRes = ctx.msg as Adapter.CDP.EventRes;
      const { params } = eventRes;
      try {
        let firstLog;
        params.log.forEach((log) => {
          const timestamp = `${new Date(Math.floor(log.timestamp / 1000000)).toLocaleString()}(${log.timestamp})`; // 换算为毫秒， 1毫秒 = 1000000纳秒
          const logPrefixTemp = `[${timestamp}] [${log.level}] [${log.source}] `;
          const logPrefix = log.module ? `${logPrefixTemp}[${log.module}] ` : `${logPrefixTemp}`;
          const consoleMessage = {
            source: 'other',
            level: 'info',
            text: `${blue(logPrefix)}${black(log.message)}`,
            lineNumber: log.line_number,
            timestamp: Date.now(),
            url: log.file_name,
          };
          const event = {
            method: ChromeEvent.LogEntryAdded,
            params: {
              entry: consoleMessage,
            },
          };
          firstLog ??= event;
          ctx.sendToDevtools(event);
        });
        return Promise.resolve(firstLog);
      } catch (e) {
        log.error(`${ChromeEvent.LogEntryAdded} failed! %s`, (e as Error)?.stack);
        return Promise.reject(e);
      }
    },
  },
  upwardMiddleWareListMap: {},
};
