import fs from 'fs';
import { Server as HTTPServer } from 'http';
import kill from 'kill-port';
import Koa from 'koa';
import { initAppClient } from '@/client';
import { SocketServer } from '@/socket-server';
import { Logger } from '@/utils/log';
import { initDbModel } from '@/db';
import { routeApp } from '@/router';
import { config } from '@/config';
import { importTunnel } from '@/child-process/import-addon';

const log = new Logger('app-debug-server');
let server: HTTPServer;
let socketServer: SocketServer;

/**
 * 开启调试服务
 */
export const startServer = async () => {
  log.info('start server argv: %j', global.debugAppArgv);
  await init();
  const { host, port, isRemote } = global.debugAppArgv;
  const app = new Koa();
  routeApp(app);

  server = app.listen(port, host, async () => {
    log.info('start debug server success.');
    let startAdbProxy;
    if (!isRemote) {
      const childProcesFn = await import('./child-process/index');
      const { startTunnel, startChrome } = childProcesFn;
      startAdbProxy = childProcesFn.startAdbProxy;

      startTunnel();
      startAdbProxy();
      startChrome();
    }

    socketServer = new SocketServer(server);
    socketServer.start();
  });

  server.on('close', () => {
    log.warn('debug server is closed.');
  });
};

/**
 * 停止调试服务
 */
export const stopServer = (exitProcess = false, ...arg) => {
  try {
    log.info('stopServer %j', arg);
    if (server) {
      server.close();
      server = null;
    }
    if (exitProcess) process.exit(0);
  } catch (e) {
    log.error('stopServer error, %s', (e as Error)?.stack);
  }
};

/**
 * 服务初始化
 */
const init = async () => {
  const { cachePath } = config;
  try {
    fs.rmdirSync(cachePath, { recursive: true });
  } catch (e) {
    log.error('rm cache dir error: %s', (e as Error)?.stack);
  }
  await importTunnel();
  await fs.promises.mkdir(cachePath, { recursive: true });
  await initDbModel();
  initAppClient();

  const { port, iWDPPort, clearAddrInUse } = global.debugAppArgv;
  if (clearAddrInUse) {
    try {
      await kill(port, 'tcp');
      await kill(iWDPPort, 'tcp');
    } catch (e) {
      log.error('Address %s %s already in use! %s', port, iWDPPort, (e as Error)?.stack);
      return process.exit(1);
    }
  }
};
