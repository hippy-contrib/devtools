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
import { WinstonColor, DevtoolsEnv } from '@/@types/enum';

const log = new Logger('app-debug-server', WinstonColor.Yellow);
let server: HTTPServer;
let socketServer: SocketServer;

/**
 * 开启调试服务
 */
export const startDebugServer = async () => {
  log.info('start server argv: %j', global.debugAppArgv);
  await init();
  const { host, port, env } = global.debugAppArgv;
  const app = new Koa();
  routeApp(app);

  server = app.listen(port, host, async () => {
    log.info('start debug server success.');
    if (env !== DevtoolsEnv.Hippy && !config.isRemote) {
      const { startTunnel, startChrome } = await import('./child-process/index');
      startTunnel();
      startChrome();
    }
    if (!config.isRemote) {
      const { startAdbProxy } = await import('./child-process/adb');
      startAdbProxy();
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
    if (socketServer) {
      socketServer.close();
      socketServer = null;
    }
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
  const { cachePath, hmrStaticPath } = config;
  try {
    fs.rmdirSync(cachePath, { recursive: true });
  } catch (e) {
    log.warn('rm cache dir error');
  }
  if (!config.isRemote) {
    const { importTunnel } = await import('@/child-process/import-addon');
    await importTunnel();
  }
  await fs.promises.mkdir(cachePath, { recursive: true });
  await fs.promises.mkdir(hmrStaticPath, { recursive: true });
  initDbModel();
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
