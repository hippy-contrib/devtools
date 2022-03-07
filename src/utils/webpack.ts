import fs from 'fs';
import path from 'path';
import HippyHMRPlugin from '@hippy/hippy-hmr-plugin';
import QRCode from 'qrcode';
import { green, yellow, bold } from 'colors/safe';
import { Logger } from '@/utils/log';
import { makeUrl, getWSProtocolByHttpProtocol } from '@/utils/url';
import { config } from '@/config';
import { PUBLIC_RESOURCE, DEFAULT_REMOTE } from '@/@types/constants';

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
  config.devServer.remote = {
    protocol: 'http',
    host: '127.0.0.1',
    port: 38989,
    qrcode: false,
    ...(config.devServer.remote || {}),
  };
  const { protocol, host, port, qrcode: qrcodeFn } = config.devServer.remote;

  // only print qrcode when use remote debug server
  const needVersionId = needPublicPathWithVersionId(host);
  // if (!needVersionId) return;

  const publicPath = getPublicPath(versionId, config.devServer.remote);
  config.output.publicPath = publicPath;
  log.warn(bold(yellow(`webpack publicPath is set as: ${config.output.publicPath}`)));

  const ignorePort = couldIgnorePort(protocol, port);
  const bundleUrl = makeUrl(`${config.output.publicPath}index.bundle`, {
    debugUrl: makeUrl(
      `${getWSProtocolByHttpProtocol(protocol)}://${host}${ignorePort ? '' : `:${port}`}/debugger-proxy`,
    ),
  });
  const homeUrl = `${protocol}://${host}${ignorePort ? '' : `:${port}`}/extensions/home.html?hash=${versionId}`;

  config.devServer.cb = () => {
    process.nextTick(() => {
      log.info('bundleUrl: %s', bold(green(bundleUrl)));
      log.info('find debug page on: %s', bold(green(homeUrl)));

      if (needVersionId && qrcodeFn && typeof qrcodeFn === 'function') {
        const qrcodeStr = qrcodeFn(bundleUrl);
        log.info('bundleUrl scheme: %s', bold(green(qrcodeStr)));
        QRCode.toString(
          qrcodeStr,
          {
            small: true,
            type: 'terminal',
          },
          (e, qrcodeStr) => {
            if (e) log.error('draw qrcode of bundleUrl failed: %j', e?.stack || e);
            log.info('scheme qrcode:\n%s', qrcodeStr);
          },
        );
      }
    });
  };
}

function appendHMRPlugin(versionId: string, config) {
  if (!config.devServer.hot && !config.devServer.liveReload) return;
  const hotManifestPublicPath = getPublicPath(versionId, config.devServer.remote);
  const i = config.plugins.findIndex((plugin) => plugin.constructor.name === HippyHMRPlugin.name);
  if (i !== -1) {
    config.plugins.splice(i, 1);
  }
  config.plugins.push(new HippyHMRPlugin({ hotManifestPublicPath }));
}

/**
 * remote debug is enabled by default if enable webpack-dev-server
 */
function isRemoteDebugEnabled(webpackConfig) {
  return webpackConfig.devServer;
}

/**
 * when use debug-server-next in local, no need to set webpack `publicPath` field,
 * only need set `hotManifestPublicPath` field
 */
function needPublicPathWithVersionId(host) {
  return !(host === 'localhost' || host === '127.0.0.1');
}

function getPublicPath(versionId, { host, port, protocol }) {
  if (host === DEFAULT_REMOTE.host) return `${PUBLIC_RESOURCE}${versionId}/`;
  const ignorePort = couldIgnorePort(protocol, port);
  if (!needPublicPathWithVersionId(host)) return `${protocol}://${host}${ignorePort ? '' : `:${port}`}/`;
  return `${protocol}://${host}${ignorePort ? '' : `:${port}`}/${versionId}/`;
}

function couldIgnorePort(protocol, port) {
  return (protocol === 'https' && Number(port) === 443) || (protocol === 'http' && Number(port) === 80);
}

/**
 * hippy-dev process will save hmrPort to file,
 * hippy-debug process will auto reverse hmrPort when device reconnect.
 */
export async function saveDevPort(hmrPort) {
  const { cachePath } = config;
  fs.mkdirSync(cachePath, { recursive: true });
  return fs.writeFileSync(config.hmrPortPath, String(hmrPort));
}
