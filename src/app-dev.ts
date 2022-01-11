import fs from 'fs';
import oldWebpack from 'webpack';
import QRCode from 'qrcode';
import { Logger } from '@/utils/log';
import { config } from '@/config';
import { getBundleVersionId } from '@/utils/bundle-version';
import { appendHMRPlugin } from '@/utils/webpack';

const log = new Logger('app-dev-server');

export const webpack = (webpackConfig, cb?) => {
  const id = getBundleVersionId();
  appendHMRPlugin(id, webpackConfig);
  const publicPath = webpackConfig.output?.publicPath;
  if (publicPath) {
    webpackConfig.output.publicPath = publicPath.replace(/\[version\]/, id);
    const isEndWithSlash = webpackConfig.output.publicPath.endsWith('/');
    const bundleUrl = `${webpackConfig.output.publicPath}${isEndWithSlash ? '' : '/'}index.bundle`;
    log.info('bundleUrl: %s', bundleUrl);
    QRCode.toString(
      bundleUrl,
      {
        small: true,
        type: 'terminal',
      },
      (e, qrcodeStr) => {
        if (e) log.error('draw qrcode of bundleUrl failed: %j', e?.stack || e);
        log.info('qrcode\n%s', qrcodeStr);
      },
    );
    const homeUrl = `${config.domain}/extensions/home.html?hash=${id}`;
    log.info('find debug page on: %s', homeUrl);
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

/**
 * hippy-dev 进程保存 hmrPort，hippy-debug 进程可监听设备连接与断连，在设备重连时自动 reverse hmrPort
 */
async function saveHmrPort(hmrPort) {
  const { cachePath } = config;
  fs.mkdirSync(cachePath, { recursive: true });
  return fs.writeFileSync(config.hmrPortPath, String(hmrPort));
}
