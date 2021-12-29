import fs from 'fs';
import path from 'path';
import oldWebpack from 'webpack';
import { Logger } from '@/utils/log';
import { config } from '@/config';

const log = new Logger('app-dev-server');

export const webpack = (webpackConfig, cb?) => {
  const compiler = oldWebpack(webpackConfig);
  startWebpackDevServer(webpackConfig, compiler, cb);
  return compiler;
};

async function startWebpackDevServer(config, compiler, cb) {
  if (!config) {
    log.error('you must config webpack.config file path to start webpack-dev-server!');
    return process.exit(0);
  }
  const hmrPort = config.devServer?.port || 38988;
  saveHmrPort(hmrPort);

  const { startAdbProxy } = await import('./child-process/index');
  startAdbProxy();

  const WebpackDevServer = (await import('./webpack-dev-server/lib/Server')).default;
  const webpackDevServer = new WebpackDevServer(config.devServer, compiler, cb);
  await webpackDevServer.start();
}

export async function getWebpackConfig(configPath) {
  let webpackConfig;
  const webpackConfigPath = path.resolve(process.cwd(), configPath);
  log.info('webpack config path: ', webpackConfigPath);
  if (configPath && fs.existsSync(webpackConfigPath)) {
    webpackConfig = await import(webpackConfigPath);
  }
  return webpackConfig?.default || webpackConfig;
}

/**
 * hippy-dev 进程保存 hmrPort，hippy-debug 进程可监听设备连接与断连，在设备重连时自动 reverse hmrPort
 */
function saveHmrPort(hmrPort) {
  return fs.writeFileSync(config.hmrPortPath, String(hmrPort));
}
