import fs from 'fs';
import { Server as HTTPServer } from 'http';
import path from 'path';
import kill from 'kill-port';
import Koa from 'koa';
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
  const { host, port, isRemote } = global.appArgv;
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

    const webpackConfig = await getWebpackConfig(global.appArgv.config);
    const hmrPort = webpackConfig.devServer?.port || 38988;
    if (hmrPort && webpackConfig) {
      global.appArgv.hmrPort = hmrPort;
      if (startAdbProxy) startAdbProxy();
      startWebpackDevServer(webpackConfig);
    }
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

async function startWebpackDevServer(webpackConfig) {
  if (!webpackConfig) return;

  const WebpackDevServer = (await import('./webpack-dev-server/lib/Server')).default;
  const Webpack = (await import('webpack')).default;
  const compiler = Webpack(webpackConfig);
  const webpackDevServer = new WebpackDevServer(webpackConfig.devServer, compiler);
  await webpackDevServer.start();
}

async function getWebpackConfig(configPath) {
  let webpackConfig;
  const webpackConfigPath = path.resolve(process.cwd(), configPath);
  log.info('webpack config path: ', webpackConfigPath);
  if (configPath && fs.existsSync(webpackConfigPath)) {
    webpackConfig = await import(webpackConfigPath);
  }
  return webpackConfig.default;
}
