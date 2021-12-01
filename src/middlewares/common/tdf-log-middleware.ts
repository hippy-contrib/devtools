import { TdfEvent } from 'tdf-devtools-protocol/dist/types/enum-tdf-mapping';
import { blue, black } from 'colors/safe';
import { ChromeEvent } from 'tdf-devtools-protocol/dist/types/enum-chrome-mapping';
import { Logger } from '@/utils/log';
import { MiddleWareManager } from '../middleware-context';

const log = new Logger('tdf-log-middleware');

export const tdfLogMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [TdfEvent.TDFLogGetLog]: async ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes<ProtocolTdf.TDFLog.GetLogEvent>;
      const { params } = eventRes;
      try {
        let firstLog;
        await Promise.all(
          params.log.map((log) => {
            const event = {
              method: ChromeEvent.LogEntryAdded,
              params: {
                entry: convertTDFLogToChromeLog(log),
              },
            };

            firstLog ??= event;
            return sendToDevtools(event);
          }),
        );
        return firstLog;
      } catch (e) {
        log.error(`${ChromeEvent.LogEntryAdded} failed! %s`, (e as Error)?.stack);
        return Promise.reject(e);
      }
    },
  },
  upwardMiddleWareListMap: {},
};

const convertTDFLogToChromeLog = (log: ProtocolTdf.TDFLog.LogInfo): ProtocolChrome.Log.LogEntry => {
  // app 端回包单位为纳秒，需换算为毫秒， 1 毫秒 = 1000000 纳秒
  const timestamp = `${new Date(Math.floor(log.timestamp / 1000000)).toLocaleString()}(${log.timestamp})`;
  const logPrefixTemp = `[${timestamp}] [${log.level}] [${log.source}] `;
  const logPrefix = log.module ? `${logPrefixTemp}[${log.module}] ` : `${logPrefixTemp}`;
  const consoleMessage = {
    // 脚本生成的类型声明使用了联合类型，为了方便处理直接转为 any
    source: 'other' as any,
    level: 'info' as any,
    text: `${blue(logPrefix)}${black(log.message)}`,
    lineNumber: log.line_number,
    timestamp: Date.now(),
    url: log.file_name,
  };
  return consoleMessage;
};
