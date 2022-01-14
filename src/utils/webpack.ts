import fs from 'fs';
import path from 'path';
import HippyHMRPlugin from '@hippy/hippy-hmr-plugin';
import QRCode from 'qrcode';
import { once } from 'lodash';
import { DEFAULT_REMOTE } from '@/@types/constants';
import { Logger } from '@/utils/log';
import { config } from '@/config';

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
  normalizeRemoteDebug(versionId, config);
  appendHMRPlugin(versionId, config);
}

function normalizeRemoteDebug(versionId, config) {
  if (!config.devServer || (config.devServer.hot === false && config.devServer.liveReload === false)) return;
  const { remote } = config.devServer;
  const fullRemote: typeof DEFAULT_REMOTE = {
    ...DEFAULT_REMOTE,
    ...remote,
  };
  config.devServer.remote = fullRemote;
  const enableRemote = isRemoteDebugEnabled(config);
  let bundleUrl;
  let homeUrl;
  if (enableRemote) {
    let { publicPath } = config.output;
    const domain = publicPath.replace(/\/\[version\]\/?/, '');
    publicPath = publicPath.replace(/\[version\]/, versionId);
    config.output.publicPath = publicPath;
    const isEndWithSlash = publicPath.endsWith('/');
    const slash = isEndWithSlash ? '' : '/';
    bundleUrl = `${publicPath}${slash}index.bundle`;
    homeUrl = `${domain}/extensions/home.html?hash=${versionId}`;
  } else {
    log.warn(
      `If you use remote HMR, you should config 'publicPath' field to '${DEFAULT_REMOTE.protocol}://${DEFAULT_REMOTE.host}:${DEFAULT_REMOTE.port}/[version]/'.`,
    );
  }

  config.devServer.cb = once(() => {
    if (!enableRemote) return;
    process.nextTick(() => {
      printDebugInfo(bundleUrl, homeUrl);
    });
  });
}

function appendHMRPlugin(versionId: string, config) {
  if (!config.devServer || (config.devServer.hot === false && config.devServer.liveReload === false)) return;
  const { host, port, protocol } = config.devServer.remote;
  const hotManifestPublicPath = `${protocol}://${host}:${port}/${versionId}/`;
  const i = config.plugins.findIndex((plugin) => plugin.constructor.name === HippyHMRPlugin.name);
  if (i !== -1) {
    config.plugins.splice(i, 1);
  }
  config.plugins.push(new HippyHMRPlugin({ hotManifestPublicPath }));
}

function isRemoteDebugEnabled(webpackConfig) {
  if (!webpackConfig.devServer?.remote || !webpackConfig.output.publicPath) return false;
  const {
    output: { publicPath },
  } = webpackConfig;
  return publicPath && /\[version\]/.test(publicPath);
}

function printDebugInfo(bundleUrl, homeUrl) {
  log.info('bundleUrl: %s', bundleUrl);
  log.info('find debug page on: %s', homeUrl);
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

/**
 * hippy-dev process will save hmrPort to file,
 * hippy-debug process will auto reverse hmrPort when device re-connect.
 */
export async function saveHmrPort(hmrPort) {
  const { cachePath } = config;
  fs.mkdirSync(cachePath, { recursive: true });
  return fs.writeFileSync(config.hmrPortPath, String(hmrPort));
}
