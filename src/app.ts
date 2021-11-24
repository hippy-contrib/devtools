import fs from 'fs';
import kill from 'kill-port';
import Koa from 'koa';
import open from 'open';
import { DevtoolsEnv } from '@/@types/enum';
import { DebugTarget } from '@/@types/debug-target';
import { initHippyEnv, initTdfEnv, initVoltronEnv, initTdfCoreEnv } from '@/client';
import { SocketServer } from '@/socket-server';
import { Logger } from '@/utils/log';
import { initDbModel } from '@/db';
import { DebugTargetManager } from '@/controller/debug-targets';
import { createRouter } from '@/router';
import { config } from '@/config';

const log = new Logger('application');

export class Application {
  public static isServerReady = false;
  private static server;
  private static socketServer: SocketServer;

  public static async startServer() {
    log.info('start server argv: %j', global.appArgv);
    const {
      host,
      port,
      iwdpPort,
      useAdb,
      useIWDP,
      clearAddrInUse,
      useTunnel,
      open: openChrome = false,
      isRemote,
    } = global.appArgv;

    Application.init();
    Application.setEnv();
    initDbModel();

    if (clearAddrInUse) {
      try {
        await kill(port, 'tcp');
        await kill(iwdpPort, 'tcp');
      } catch (e) {
        log.error('Address already in use! %s', (e as Error)?.stack);
        return process.exit(1);
      }
    }
    return new Promise((resolve, reject) => {
      const app = new Koa();
      createRouter(app);

      Application.server = app.listen(port, host, async () => {
        log.info('start debug server.');
        if (!isRemote) {
          import('./child-process/index').then(({ startTunnel, startIWDP, startAdbProxy }) => {
            if (useTunnel) startTunnel();
            else if (useIWDP) startIWDP();
            if (useAdb) startAdbProxy();
          });

          if (openChrome) {
            try {
              open(`http://${host}:${port}/extensions/home.html`, { app: { name: open.apps.chrome } });
            } catch (e) {
              log.error('open chrome failed, %s', (e as Error)?.stack);
            }
          }
        }

        Application.socketServer = new SocketServer(Application.server);
        Application.socketServer.start();
        Application.isServerReady = true;
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
      Application.isServerReady = false;
      if (exitProcess)
        setTimeout(() => {
          process.exit(0);
        }, 100);
    } catch (e) {
      log.error('stopServer error, %s', (e as Error)?.stack);
    }
  }

  public static getDebugTargets(): Promise<DebugTarget[]> {
    return DebugTargetManager.getDebugTargets();
  }

  public static registerDomainListener(domain, listener) {
    Application.socketServer.registerDomainListener(domain, listener);
  }

  private static init() {
    const { cachePath } = config;
    try {
      fs.rmdirSync(cachePath, { recursive: true });
    } catch (e) {
      log.error('rm cache dir error: %s', (e as Error)?.stack);
    }
    return fs.promises.mkdir(cachePath, { recursive: true });
  }

  private static setEnv() {
    const initFn = {
      [DevtoolsEnv.Hippy]: initHippyEnv,
      [DevtoolsEnv.Voltron]: initVoltronEnv,
      [DevtoolsEnv.TDF]: initTdfEnv,
      [DevtoolsEnv.TDFCore]: initTdfCoreEnv,
    }[global.appArgv.env];
    initFn();
  }
}

// 捕获程序退出
process.on('exit', () => Application.stopServer(true));
// 捕获 ctrl c
process.on('SIGINT', () => Application.stopServer(true));
// 捕获 kill
process.on('SIGTERM', () => Application.stopServer(true));

process.on('unhandledRejection', (e: Error) => {
  log.error(`unhandledRejection %s`, e?.stack);
});
