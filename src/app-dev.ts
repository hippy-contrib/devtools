import oldWebpack from 'webpack';
import { Logger } from '@/utils/log';
import { getBundleVersionId } from '@/utils/bundle-version';
import { normalizeWebpackConfig, saveHmrPort } from '@/utils/webpack';

const log = new Logger('app-dev-server');

export const webpack = (webpackConfig, cb?) => {
  const id = getBundleVersionId();
  normalizeWebpackConfig(id, webpackConfig);
  if (webpackConfig.devServer) {
    webpackConfig.devServer.id = id;
  }
  const compiler = oldWebpack(webpackConfig);
  const cbWithQRCode = (err, stats) => {
    if (cb) cb(err, stats);
    webpackConfig.devServer?.cb();
  };
  startWebpackDevServer(webpackConfig, compiler, cbWithQRCode);
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


