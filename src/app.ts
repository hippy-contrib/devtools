import fs from 'fs';
import { Server as HTTPServer } from 'http';
import kill from 'kill-port';
import Koa from 'koa';
import open from 'open';
import { initAppClient } from '@/client';
import { SocketServer } from '@/socket-server';
import { Logger } from '@/utils/log';
import { initDbModel } from '@/db';
import { routeApp } from '@/router';
import { config } from '@/config';

const log = new Logger('application');
let server: HTTPServer;
let socketServer: SocketServer;

/**
 * 开启调试服务
 */
export const startServer = async () => {
  log.info('start server argv: %j', global.appArgv);
  await init();
  const { host, port, useAdb, useIWDP, useTunnel, open: openChrome, isRemote } = global.appArgv;
  const app = new Koa();
  routeApp(app);

  server = app.listen(port, host, async () => {
    log.info('start debug server success.');
    if (!isRemote) {
      const { startTunnel, startIWDP, startAdbProxy } = await import('./child-process/index');
      if (useTunnel) startTunnel();
      else if (useIWDP) startIWDP();
      if (useAdb) startAdbProxy();

      if (openChrome) {
        const url = `http://${host}:${port}/extensions/home.html`;
        try {
          open(url, { app: { name: open.apps.chrome } });
        } catch (e) {
          log.error('open %s by chrome failed, please open manually, %s', url, (e as Error)?.stack);
        }
      }
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
    log.warn('rm cache dir error: %s', (e as Error)?.stack);
  }
  await fs.promises.mkdir(cachePath, { recursive: true });
  await initDbModel();
  initAppClient();

  const { port, iWDPPort, clearAddrInUse } = global.appArgv;
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
