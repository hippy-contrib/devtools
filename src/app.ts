import fs from 'fs';
import { Server as HTTPServer } from 'http';
import kill from 'kill-port';
import Koa from 'koa';
import open from 'open';
import { DebugTarget } from '@/@types/debug-target';
import { initAppClient } from '@/client';
import { SocketServer } from '@/socket-server';
import { Logger } from '@/utils/log';
import { initDbModel } from '@/db';
import { DebugTargetManager } from '@/controller/debug-targets';
import { routeApp } from '@/router';
import { config } from '@/config';

const log = new Logger('application');

export class Application {
  private static server: HTTPServer;
  private static socketServer: SocketServer;

  public static async startServer() {
    log.info('start server argv: %j', global.appArgv);
    const { host, port, useAdb, useIWDP, useTunnel, open: openChrome, isRemote } = global.appArgv;
    await Application.init();
    return new Promise((resolve, reject) => {
      const app = new Koa();
      routeApp(app);

      Application.server = app.listen(port, host, async () => {
        log.info('start debug server success.');
        if (!isRemote) {
          const { startTunnel, startIWDP, startAdbProxy } = await import('./child-process/index');
          log.warn('动态 import ()', typeof startTunnel);
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

        Application.socketServer = new SocketServer(Application.server);
        Application.socketServer.start();
        resolve(null);
      });

      Application.server.on('close', () => {
        log.info('debug server is closed.');
        reject();
      });
    });
  }

  public static stopServer(exitProcess = false) {
    try {
      log.info('stopServer');
      if (Application.server) {
        Application.server.close();
        Application.server = null;
      }
      if (exitProcess) process.exit(0);
    } catch (e) {
      log.error('stopServer error, %s', (e as Error)?.stack);
    }
  }

  public static getDebugTargets(): Promise<DebugTarget[]> {
    return DebugTargetManager.getDebugTargets();
  }

  private static async init() {
    const { cachePath } = config;
    try {
      fs.rmdirSync(cachePath, { recursive: true });
    } catch (e) {
      log.error('rm cache dir error: %s', (e as Error)?.stack);
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
  }
}

// 捕获程序退出
process.on('exit', () => Application.stopServer(true));
// 捕获 ctrl c
process.on('SIGINT', () => Application.stopServer(true));
// 捕获 kill
process.on('SIGTERM', () => Application.stopServer(true));

const logErr = (e: Error) => log.error(`unhandledRejection %s`, e?.stack);
process.on('unhandledRejection', logErr);
process.on('uncaughtexception', logErr);
