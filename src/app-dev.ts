import fs from 'fs';
import path from 'path';
import oldWebpack from 'webpack';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@/utils/log';
import { config } from '@/config';

const log = new Logger('app-dev-server');

export const webpack = (webpackConfig, cb?) => {
  const id = uuidv4();
  const publicPath = webpackConfig.output?.publicPath;
  if (publicPath) {
    webpackConfig.output.publicPath = publicPath.replace(/[version]/, id);
  }
  if (webpackConfig.devServer) {
    webpackConfig.devServer.id = id;
  }
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

  const { startAdbProxy } = await import('./child-process/adb');
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
async function saveHmrPort(hmrPort) {
  const { cachePath } = config;
  fs.mkdirSync(cachePath, { recursive: true });
  return fs.writeFileSync(config.hmrPortPath, String(hmrPort));
}
