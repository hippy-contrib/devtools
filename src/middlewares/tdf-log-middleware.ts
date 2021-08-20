import { MiddleWare } from './middleware-context';
import { ChromeEvent } from 'tdf-devtools-protocol/types/enum-chrome-mapping';

export const onGetTDFLog: MiddleWare = async (ctx) => {
  const eventRes = ctx.msg as Adapter.CDP.EventRes;
  const { params } = eventRes;
  try {
    params.log.forEach((log) => {
      const timestamp = `${new Date(Math.floor(log.timestamp / 1000000)).toLocaleString()}(${log.timestamp})`; // 换算为毫秒， 1毫秒 = 1000000纳秒
      const logPrefix = `[${timestamp}][${log.level}][${log.source}]`;
      const consoleMessage = {
        source: 'other',
        level: 'info',
        text: log.module ? `${logPrefix}[${log.module}]${log.message}` : `${logPrefix}${log.message}`,
        lineNumber: log.line_number,
        timestamp,
        url: log.file_name,
      };
      ctx.sendToDevtools({
        method: ChromeEvent.LogEntryAdded,
        params: {
          entry: consoleMessage,
        },
      });
    });
  } catch (e) {
    console.error(`${ChromeEvent.LogEntryAdded} failed!`, e);
  }
};
