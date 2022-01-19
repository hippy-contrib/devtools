import fs from 'fs';
import path from 'path';
import HippyHMRPlugin from '@hippy/hippy-hmr-plugin';
import QRCode from 'qrcode';
import { once } from 'lodash';
import { green, bold } from 'colors/safe';
import { Logger } from '@/utils/log';
import { makeUrl, getWSProtocolByHttpProtocol } from '@/utils/url';
import { config } from '@/config';
import { PUBLIC_RESOURCE } from '@/@types/constants';

const log = new Logger('webpack-util');

export async function getWebpackConfig(configPath) {
  let webpackConfig;
  const webpackConfigPath = path.resolve(process.env.PWD, configPath);
  if (configPath && fs.existsSync(webpackConfigPath)) {
    webpackConfig = await import(webpackConfigPath);
  }
  return webpackConfig?.default || webpackConfig;
}

export function normalizeWebpackConfig(versionId, config) {
  const enableRemoteDebug = isRemoteDebugEnabled(config);
  if (!enableRemoteDebug) return log.warn('remote debug is disabled!');

  normalizeRemoteDebug(versionId, config);
  appendHMRPlugin(versionId, config);
}

function normalizeRemoteDebug(versionId, config) {
  config.devServer.remote ||= {
    protocol: 'http',
    host: '127.0.0.1',
    port: 38989,
  };
  const { protocol, host, port } = config.devServer.remote;

  if (host && port && protocol === false) {
    log.warn('you must config remote host, port and protocol!');
    process.exit(1);
  }

  config.output.publicPath = getPublicPath(versionId);
  log.warn(bold(green(`webpack publicPath is set as: ${config.output.publicPath}`)));
  const bundleURL = makeUrl(`${config.output.publicPath}index.bundle`, {
    debugURL: makeUrl(`${getWSProtocolByHttpProtocol(protocol)}://${host}:${port}/debugger-proxy`),
  });
  const homeURL = `${protocol}://${host}:${port}/extensions/home.html?hash=${versionId}`;

  config.devServer.cb = once(() => {
    process.nextTick(() => {
      printDebugInfo(bundleURL, homeURL);
    });
  });
}

function appendHMRPlugin(versionId: string, config) {
  if (config.devServer.hot && config.devServer.liveReload === false) return;
  const hotManifestPublicPath = getPublicPath(versionId);
  const i = config.plugins.findIndex((plugin) => plugin.constructor.name === HippyHMRPlugin.name);
  if (i !== -1) {
    config.plugins.splice(i, 1);
  }
  config.plugins.push(new HippyHMRPlugin({ hotManifestPublicPath }));
}

/**
 * remote debug is enabled by default if enable webpack-dev-server
 * you could disable it by set `devServer.remote: false`
 */
function isRemoteDebugEnabled(webpackConfig) {
  return !(!webpackConfig.devServer || webpackConfig.devServer.remote === false);
}

function printDebugInfo(bundleUrl, homeUrl) {
  log.info('bundleUrl: %s', bold(green(bundleUrl)));
  log.info('find debug page on: %s', bold(green(homeUrl)));
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
}

function getPublicPath(versionId) {
  return `${PUBLIC_RESOURCE}${versionId}/`;
}

/**
 * hippy-dev process will save hmrPort to file,
 * hippy-debug process will auto reverse hmrPort when device re-connect.
 */
export async function saveHmrPort(hmrPort) {
  const { cachePath } = config;
  fs.mkdirSync(cachePath, { recursive: true });
  return fs.writeFileSync(config.hmrPortPath, String(hmrPort));
}
