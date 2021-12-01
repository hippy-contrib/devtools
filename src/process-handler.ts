import { Logger } from '@/utils/log';
import { killChildProcess } from '@/child-process';
import { stopServer } from './app';

const log = new Logger('process-handler');
const onExit = (...arg) => {
  killChildProcess();
  stopServer(true, ...arg);
};
const onError = (e: Error) => log.error('unhandledRejection %s', e?.stack);

// 捕获 promise reject
process.on('unhandledRejection', onError);
// 捕获未处理的异常
process.on('uncaughtexception', onError);
// 捕获程序退出
process.on('exit', onExit);
// 捕获 ctrl c
process.on('SIGINT', onExit);
// 捕获 kill
process.on('SIGTERM', onExit);
