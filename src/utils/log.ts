import path from 'path';
import util from 'util';
import colors from 'colors/safe';
import { Logger as WinstonLogger, transports, format, createLogger } from 'winston';
import { lowerFirst, uniq, random } from 'lodash';
import { WinstonColor, LogLevel } from '@/@types/enum';
import { config } from '@/config';
import { aegis } from '@/utils/aegis';
import 'winston-daily-rotate-file';

export class Logger {
  protected logFilename;
  private loggerInstance: WinstonLogger;
  private label: string;
  private color: string;

  public constructor(label = '', color?: string, logFilename?: string) {
    this.label = label;
    this.color = color || getRandomColor();
    this.logFilename = logFilename || '%DATE%.log';
    this.initLoggerInstance();
  }

  public info(...args) {
    this.log(LogLevel.Info, ...args);
  }

  public verbose(...args) {
    this.log(LogLevel.Verbose, ...args);
  }

  public debug(...args) {
    this.log(LogLevel.Debug, ...args);
  }

  public silly(...args) {
    this.log(LogLevel.Silly, ...args);
  }

  public warn(...args) {
    this.log(LogLevel.Warn, ...args);
  }

  public error(...args) {
    this.log(LogLevel.Error, ...args);
    const errMsg = args.reduce((prev, curr) => {
      if (curr instanceof Error) {
        prev += `\n${curr.stack}`;
      } else if (typeof curr === 'string') {
        prev += curr;
      } else {
        prev += String(curr);
      }
    }, '');
    aegis.report(new Error(errMsg));
  }

  private log(level, ...args) {
    const msg = util.format(...args);
    this.loggerInstance.log(level, msg);
  }

  private initLoggerInstance() {
    const label = colors[this.color](this.label);
    this.loggerInstance = createLogger({
      format: format.combine(
        format.errors({ stack: true }),
        format.label({ label }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.colorize(),
        format.printf(({ level, message, label, timestamp }) => `${timestamp} ${label} ${level} ${message}`),
      ),
      transports: [
        new transports.DailyRotateFile({
          filename: path.join(config.logPath, this.logFilename),
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: false,
          maxSize: '20m',
          maxFiles: '7d',
        }),
        new transports.Console({
          level: global.debugAppArgv?.log || LogLevel.Info,
        }),
      ].filter(Boolean),
    });
  }
}

export class TunnelLogger extends Logger {
  public constructor(label = '', color?: string, logFilename?: string) {
    super(label, color, logFilename || '%DATE%.tunnel.log');
  }
}

export class UserLogger extends Logger {}

const winstonColors = uniq(Object.values(WinstonColor).map(lowerFirst));
function getRandomColor() {
  return winstonColors[random(winstonColors.length - 1)];
}
