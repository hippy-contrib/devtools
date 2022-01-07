import fs from 'fs';
import path from 'path';
import HippyHMRPlugin from '@hippy/hippy-hmr-plugin';
import { DEFAULT_REMOTE } from '@/@types/constants';

export async function getWebpackConfig(configPath) {
  let webpackConfig;
  const webpackConfigPath = path.resolve(process.env.PWD, configPath);
  if (configPath && fs.existsSync(webpackConfigPath)) {
    webpackConfig = await import(webpackConfigPath);
  }
  return webpackConfig?.default || webpackConfig;
}

export function appendHMRPlugin(versionId: string, config) {
  if (!config.devServer || (config.devServer.hot === false && config.devServer.liveReload === false)) return;
  const { remote } = config.devServer;
  const fullRemote: typeof DEFAULT_REMOTE = {
    ...DEFAULT_REMOTE,
    ...remote,
  };
  const { host, port, protocol } = fullRemote;
  config.devServer.remote = fullRemote;
  const hotManifestPublicPath = `${protocol}://${host}:${port}/${versionId}/`;
  const i = config.plugins.findIndex((plugin) => plugin.constructor.name === HippyHMRPlugin.name);
  if (i !== -1) {
    config.plugins.splice(i, 1);
  }
  config.plugins.push(new HippyHMRPlugin({ hotManifestPublicPath }));
}
