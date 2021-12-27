import fs from 'fs';
import path from 'path';
import { Logger } from '@/utils/log';
import { config } from '@/config';

const log = new Logger('app-dev-server');

export async function startWebpackDevServer(config) {
  const webpackConfig = await getWebpackConfig(config);
  if (!webpackConfig) {
    log.error('you must config webpack.config file path to start webpack-dev-server!');
    return process.exit(0);
  }
  const hmrPort = webpackConfig.devServer?.port || 38988;
  saveHmrPort(hmrPort);

  const { startAdbProxy } = await import('./child-process/index');
  startAdbProxy();

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
  return webpackConfig?.default || webpackConfig;
}

/**
 * hippy-dev 进程保存 hmrPort，hippy-debug 进程可监听设备连接与断连，在设备重连时自动 reverse hmrPort
 */
function saveHmrPort(hmrPort) {
  return fs.writeFileSync(config.hmrPortPath, String(hmrPort));
}
