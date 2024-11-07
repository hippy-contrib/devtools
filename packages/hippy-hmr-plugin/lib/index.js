const Template = require('webpack/lib/Template');
const JsonpMainTemplateRuntime = require('./JsonpMainTemplate.runtime');
const LoadScriptTemplateRuntime = require('./LoadScriptTemplate.runtime');

const builtInJsonpPlugin = 'JsonpMainTemplatePlugin';
// use a big stage to ensure register later than builtin JsonpMainTemplatePlugin,
// thus we could remove the builtin JsonpMainTemplatePlugin
const HMRStage = 1000;

class HippyHMRPlugin {
  constructor({ hotManifestPublicPath }) {
    this.hotManifestPublicPath = hotManifestPublicPath;
  }

  apply(compiler) {
    removeTap(compiler.hooks.thisCompilation.taps, HippyHMRPlugin.name);
    if(getWebpackVersion(compiler) === '4') {
      this.applyV4(compiler);
    } else if(getWebpackVersion(compiler) === '5') {
      this.applyV5(compiler);
    }
  }

  applyV4(compiler) {
    this.hookPublicPath(compiler);
    compiler.hooks.thisCompilation.tap(
      {
        name: HippyHMRPlugin.name,
        stage: HMRStage,
      },
      (compilation) => {
        const { mainTemplate } = compilation;
        removeTap(mainTemplate.hooks.hotBootstrap.taps, builtInJsonpPlugin);
        mainTemplate.hooks.hotBootstrap.tap(builtInJsonpPlugin, (source, chunk, hash) => {
          const globalObject = mainTemplate.outputOptions.globalObject;
          const hotUpdateChunkFilename = mainTemplate.outputOptions.hotUpdateChunkFilename;
          const hotUpdateMainFilename = mainTemplate.outputOptions.hotUpdateMainFilename;
          const crossOriginLoading = mainTemplate.outputOptions.crossOriginLoading;
          const hotUpdateFunction = mainTemplate.outputOptions.hotUpdateFunction;
          const currentHotUpdateChunkFilename = mainTemplate.getAssetPath(JSON.stringify(hotUpdateChunkFilename), {
            hash: `" + ${mainTemplate.renderCurrentHashCode(hash)} + "`,
            hashWithLength: (length) => `" + ${mainTemplate.renderCurrentHashCode(hash, length)} + "`,
            chunk: {
              id: '" + chunkId + "',
            },
          });
          const currentHotUpdateMainFilename = mainTemplate.getAssetPath(JSON.stringify(hotUpdateMainFilename), {
            hash: `" + ${mainTemplate.renderCurrentHashCode(hash)} + "`,
            hashWithLength: (length) => `" + ${mainTemplate.renderCurrentHashCode(hash, length)} + "`,
          });
          const runtimeSource = Template.getFunctionContent(JsonpMainTemplateRuntime)
            .replace(/\/\/\$semicolon/g, ';')
            .replace(/\$require\$/g, mainTemplate.requireFn)
            .replace(/\$crossOriginLoading\$/g, crossOriginLoading ? JSON.stringify(crossOriginLoading) : 'null')
            .replace(/\$hotMainFilename\$/g, currentHotUpdateMainFilename)
            .replace(/\$hotChunkFilename\$/g, currentHotUpdateChunkFilename)
            .replace(/\$hash\$/g, JSON.stringify(hash));
          return `${source}
function hotDisposeChunk(chunkId) {
	delete installedChunks[chunkId];
}
var parentHotUpdateCallback = ${globalObject}[${JSON.stringify(hotUpdateFunction)}];
${globalObject}[${JSON.stringify(hotUpdateFunction)}] = ${runtimeSource}`;
        });
      },
    );


  }

  applyV5(compiler) {
    this.hookPublicPath(compiler);
    compiler.hooks.compilation.tap({
      name: HippyHMRPlugin.name,
      stage: HMRStage,
    }, (compilation) => {
      compilation.mainTemplate.hooks.localVars.tap('Require', (source, chunk, hash) => {
        const { mainTemplate } = compilation;
        const hotUpdateMainFilename = mainTemplate.outputOptions.hotUpdateMainFilename;
        const currentHotUpdateMainFilename = mainTemplate.getAssetPath(JSON.stringify(hotUpdateMainFilename), {
          hash: `" + ${mainTemplate.renderCurrentHashCode(hash)} + "`,
          hashWithLength: (length) => `" + ${mainTemplate.renderCurrentHashCode(hash, length)} + "`,
        });

        const loadScriptSource = Template.getFunctionContent(LoadScriptTemplateRuntime)
        .replace(/\$require\$/g, mainTemplate.requireFn)
        .replace(/\$hotMainFilename\$/g, currentHotUpdateMainFilename)

        // hotDownloadManifest will use hotManifestPublicPath to concat the full manifest path.
        return `var hotManifestPublicPath = '${this.hotManifestPublicPath}'; \n${loadScriptSource}\n${source}`;
      });
    });
  }

  hookPublicPath(compiler) {
    compiler.hooks.compilation.tap('VendorImport', (compilation) => {
      compilation.mainTemplate.hooks.localVars.tap('Require', (source) => {
        // hotDownloadManifest will use hotManifestPublicPath to concat the full manifest path.
        return `var hotManifestPublicPath = '${this.hotManifestPublicPath}'; \n${source}`;
      });
    });
  }
}

function removeTap(taps, names) {
  [].concat(names).forEach(name => {
    for(let i = 0; i < (taps || []).length; i++) {
      const tap = taps[i];
      if(tap.name === name) {
        taps.splice(i, 1);
        i--;
      }
    }
  });
}

// only consider version >=4
function getWebpackVersion(compiler) {
  if(!compiler.webpack) return '4';
  const version = compiler.webpack.version.split('.')[0];
  return version;
}

module.exports = HippyHMRPlugin;
