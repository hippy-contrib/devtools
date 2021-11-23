import path from 'path';
import util from 'util';
import colors from 'colors/safe';
import winston from 'winston';
import { config } from '@/config';
import 'winston-daily-rotate-file';

export class Logger {
  static debugMap = {};

  private loggerInstance: winston.Logger;

  constructor(private label: string = '', private color?: string) {
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
    const transport = new winston.transports.DailyRotateFile({
      filename: path.join(config.logPath, '%DATE%.log'),
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '7d',
    });
    const { format } = winston;
    const label = this.color ? colors[this.color](this.label) : (colors as any).maps.random(this.label);
    this.loggerInstance = winston.createLogger({
      format: format.combine(
        format.errors({ stack: true }),
        format.label({ label }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.colorize(),
        format.printf(({ level, message, label, timestamp }) => `${timestamp} ${label} ${level} ${message}`),
      ),
      transports: [transport, new winston.transports.Console()],
    });
  }
}
