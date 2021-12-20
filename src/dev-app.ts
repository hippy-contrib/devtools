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

export async function startWebpackDevServer(config) {
  const webpackConfig = await getWebpackConfig(config);
  const hmrPort = webpackConfig.devServer?.port || 38988;
  if (hmrPort && webpackConfig) {
    global.appArgv.hmrPort = hmrPort;
    startAdbProxy();
  }

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
