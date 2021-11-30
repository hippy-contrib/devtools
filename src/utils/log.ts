import path from 'path';
import util from 'util';
import colors, { random } from 'colors/safe';
import { Logger as WinstonLogger, transports, format, createLogger } from 'winston';
import { config } from '@/config';
import 'winston-daily-rotate-file';

export class Logger {
  private loggerInstance: WinstonLogger;

  public constructor(private label: string = '', private color?: string) {
    this.initLoggerInstance();
  }

  public info(...args) {
    this.log('info', ...args);
  }

  public warn(...args) {
    this.log('warn', ...args);
  }

  public error(...args) {
    this.log('error', ...args);
  }

  private log(level, ...args) {
    const msg = util.format(...args);
    this.loggerInstance.log(level, msg);
  }

  private initLoggerInstance() {
    const transport = new transports.DailyRotateFile({
      filename: path.join(config.logPath, '%DATE%.log'),
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '7d',
    });
    const label = this.color ? colors[this.color](this.label) : random(this.label);
    this.loggerInstance = createLogger({
      format: format.combine(
        format.errors({ stack: true }),
        format.label({ label }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.colorize(),
        format.printf(({ level, message, label, timestamp }) => `${timestamp} ${label} ${level} ${message}`),
      ),
      transports: [transport, new transports.Console()],
    });
  }
}
