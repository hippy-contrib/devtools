import fs from 'fs';
import { Server as HTTPServer } from 'http';
import Koa from 'koa';
import colors from 'colors/safe';
import { initAppClient } from '@/client';
import { SocketServer } from '@/socket-server';
import { Logger } from '@/utils/log';
import { initDbModel } from '@/db';
import { routeApp } from '@/router';
import { config } from '@/config';
import { WinstonColor, DevtoolsEnv, DebugTunnel } from '@/@types/enum';
import { getHomeUrl } from '@/utils/url';
import { isPortInUse } from '@/utils/port';

const log = new Logger('debug-server', WinstonColor.Yellow);
let server: HTTPServer;
let socketServer: SocketServer;

/**
 * 开启调试服务
 */
export const startDebugServer = async () => {
  log.info('start server argv: %j', global.debugAppArgv);
  await init();

  const { host, port, env } = global.debugAppArgv;
  if (env === DevtoolsEnv.Hippy) showHippyGuide();
  const app = new Koa();
  routeApp(app);

  server = app.listen(port, host, async () => {
    if (!config.isCluster) {
      const { startTunnel, startChrome } = await import('./child-process/index');
      await startTunnel();
      startChrome();

      const { startAdbProxy } = await import('./child-process/adb');
      startAdbProxy();
    }

    socketServer = new SocketServer(server);
    socketServer.start();
  });

  server.on('close', () => {
    log.warn('debug server is closed.');
  });

  server.on('error', (e) => {
    log.error('launch debug server failed: %j', e);
  });
};

/**
 * 停止调试服务
 */
export const stopServer = async (exitProcess = false, ...arg) => {
  try {
    log.info('stopServer %j', arg);
    if (socketServer) {
      await socketServer.close();
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
 * init DB, directory, Tunnel.node, AppClient
 */
const init = async () => {
  normalizeArgv();
  await checkPort();
  const { cachePath, hmrStaticPath } = config;
  try {
    fs.rmdirSync(cachePath, { recursive: true });
  } catch (e) {
    if ((e as any).code !== 'ENOENT') log.error('rm cache dir error');
  }
  if (!config.isCluster) {
    const { importTunnel } = await import('@/child-process/import-addon');
    await importTunnel();
  }
  await fs.promises.mkdir(cachePath, { recursive: true });
  await fs.promises.mkdir(hmrStaticPath, { recursive: true });
  initDbModel();
  initAppClient();
};

const showHippyGuide = () => {
  log.info(
    colors.bold[WinstonColor.Green](`hippy debug steps:
1. start debug server by run 'npm run hippy:debug'
2. start dev server by run 'npm run hippy:dev'
3. open hippy pages with debugMode on mobile/emulator
4. find connected debug targets on devtools home page: ${colors.underline[WinstonColor.Blue](getHomeUrl())}

find full guide on ${colors.underline[WinstonColor.Blue]('https://hippyjs.org/#/guide/debug')}`),
  );
};

/**
 * set default tunnel in different framework
 */
const normalizeArgv = () => {
  const { env, tunnel } = global.debugAppArgv;
  if (tunnel) return;
  if ([DevtoolsEnv.Hippy, DevtoolsEnv.HippyTDF].includes(env)) {
    global.debugAppArgv.tunnel = DebugTunnel.WS;
  } else if (env === DevtoolsEnv.TDFCore) {
    global.debugAppArgv.tunnel = DebugTunnel.TCP;
  }
};

const checkPort = async () => {
  const { port } = global.debugAppArgv;
  const inUse = await isPortInUse(port);
  if (inUse) {
    log.error('EADDRINUSE: port %d is in use!', port);
    process.exit(1);
  }
};
