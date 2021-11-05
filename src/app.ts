import fs from 'fs';
import kill from 'kill-port';
import Koa from 'koa';
import cors from '@koa/cors';
import serve from 'koa-static';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import path from 'path';
import { DevtoolsEnv } from './@types/enum';
import { DebugTarget } from './@types/tunnel.d';
import { onExit, startAdbProxy, startIosProxy, startTunnel } from './child-process';
import { initHippyEnv, initTdfEnv, initVoltronEnv, initTdfCoreEnv } from './client';
import { config, setConfig } from './config';
import { DebugTargetManager, getChromeInspectRouter } from './router/chrome-inspect-router';
import { SocketServer } from './socket-server';
import { Logger } from './utils/log';
import { StartServerArgv } from './@types/app';
import open from 'open';

const log = new Logger('application');

export class Application {
  public static isServerReady = false;
  private static argv: StartServerArgv;
  private static server;
  private static socketServer: SocketServer;

  public static async startServer(argv: StartServerArgv) {
    log.info('start server argv: %j', argv);
    const {
      host,
      port,
      static: staticPath,
      entry,
      iwdpPort,
      startAdb,
      startIWDP,
      clearAddrInUse,
      startTunnel: shouldStartTunnel,
      env,
      publicPath,
      cachePath,
      logPath,
      open: openChrome = false,
    } = argv;
    if (cachePath) setConfig('cachePath', cachePath);
    if (logPath) setConfig('logPath', logPath);
    Application.argv = argv;
    Application.init();
    Application.setEnv(env as DevtoolsEnv);

    if (clearAddrInUse) {
      try {
        await kill(port, 'tcp');
        await kill(iwdpPort, 'tcp');
      } catch (e) {
        log.error('Address already in use!');
        return process.exit(1);
      }
    }
    return new Promise((resolve, reject) => {
      const app = new Koa();
      app.use(cors());
      app.use(conditional());
      app.use(etag());

      Application.server = app.listen(port, host, () => {
        log.info('start debug server.');
        if (shouldStartTunnel) startTunnel(argv);
        else if (startIWDP) startIosProxy(argv);
        if (startAdb) startAdbProxy(port);

        Application.socketServer = new SocketServer(Application.server, argv);
        Application.socketServer.start();
        Application.isServerReady = true;
        if (openChrome) open(`http://localhost:${port}/extensions/home.html`, { app: { name: open.apps.chrome } });
        resolve(null);
      });

      Application.server.on('close', () => {
        log.info('debug server is closed.');
        reject();
      });

      app.use(async (ctx, next) => {
        try {
          await next();
        } catch (e) {
          log.error('koa error: %j', e);
          return (ctx.body = e.msg);
        }
      });

      const chromeInspectRouter = getChromeInspectRouter(argv);
      app.use(chromeInspectRouter.routes()).use(chromeInspectRouter.allowedMethods());

      let servePath;
      if (staticPath) {
        servePath = path.resolve(staticPath);
      } else {
        servePath = path.resolve(path.dirname(entry));
      }
      log.info(`serve bundle: ${entry} \nserve folder: ${servePath}`);

      app.use(
        serve(servePath, {
          setHeaders: (res, path) => {
            if (/index\.bundle$/.test(path)) {
              res.setHeader('Content-Type', 'application/javascript');
            }
          },
        }),
      );
      app.use(serve(publicPath || path.join(__dirname, 'public')));
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
      log.error('stopServer error, %j', e);
    }
  }

  public static exit() {
    onExit();
  }

  public static async selectDebugTarget(id: string) {
    const debugTarget = await DebugTargetManager.findTarget(id);
    this.socketServer.selectDebugTarget(debugTarget);
  }

  public static getDebugTargets(): Promise<DebugTarget[]> {
    return DebugTargetManager.getDebugTargets();
  }

  public static sendMessage(msg: Adapter.CDP.Req) {
    return Application.socketServer.sendMessage(msg);
  }

  public static registerDomainListener(domain, listener) {
    Application.socketServer.registerDomainListener(domain, listener);
  }

  private static init() {
    try {
      fs.rmdirSync(config.cachePath, { recursive: true });
    } catch (e) {
      log.error('rm cache dir error: %j', e);
    }
    return fs.promises.mkdir(config.cachePath, { recursive: true });
  }

  private static setEnv(env: DevtoolsEnv) {
    setConfig('env', env);
    if (env === DevtoolsEnv.Hippy) initHippyEnv();
    else if (env === DevtoolsEnv.Voltron) initVoltronEnv();
    else if (env === DevtoolsEnv.TDF) initTdfEnv();
    else if (env === DevtoolsEnv.TDFCore) initTdfCoreEnv();
  }
}

process.on('exit', () => Application.stopServer(true));
// catch ctrl c
process.on('SIGINT', () => Application.stopServer(true));
// catch kill
process.on('SIGTERM', () => Application.stopServer(true));

process.on('unhandledRejection', (e) => {
  log.error('unhandledRejection %j', e);
});
