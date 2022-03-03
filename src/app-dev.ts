import oldWebpack from 'webpack';
import { Logger } from '@/utils/log';
import { getBundleVersionId } from '@/utils/bundle-version';
import { normalizeWebpackConfig } from '@/utils/webpack';

const log = new Logger('app-dev-server');

export const webpack = async (webpackConfig, cb?) => {
  if (!webpackConfig) {
    log.error('you must config webpack.config file path to start webpack-dev-server!');
    return process.exit(0);
  }
  const id = getBundleVersionId();
  normalizeWebpackConfig(id, webpackConfig);
  if (webpackConfig.devServer) {
    webpackConfig.devServer.id = id;
  }
  const compiler = oldWebpack(webpackConfig);
  const WebpackDevServer = (await import('./webpack-dev-server/lib/Server')).default;
  const webpackDevServer = new WebpackDevServer(webpackConfig.devServer, compiler, (err, stats) => {
    if (cb) cb(err, stats);
    if (webpackConfig.devServer?.cb) webpackConfig.devServer.cb();
  });
  await webpackDevServer.start();
  return compiler;
};
