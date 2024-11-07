var hotAddUpdateChunk = undefined;
var hotSetStatus = undefined;
var parentHotUpdateCallback = undefined;
var $require$ = undefined;
var $hotMainFilename$ = undefined;
var $hotChunkFilename$ = undefined;

module.exports = function() {
	// eslint-disable-next-line no-unused-vars -- used in hmr runtime
	function webpackHotUpdateCallback(chunkId, moreModules) {
		hotAddUpdateChunk(chunkId, moreModules);
		if (parentHotUpdateCallback) parentHotUpdateCallback(chunkId, moreModules);
	}

	// eslint-disable-next-line no-unused-vars -- used in hmr runtime
	function hotDownloadUpdateChunk(chunkId) {
		const src = $require$.p + $hotChunkFilename$;
		global.dynamicLoad(src, (e) => {
      if(!e) return;
      console.warn('hotDownloadUpdateChunk error: ', e);
      hotSetStatus('fail');
    })
	}

	// eslint-disable-next-line no-unused-vars -- used in hmr runtime
	function hotDownloadManifest(requestTimeout) {
		requestTimeout = requestTimeout || 10000;
    var requestPath = hotManifestPublicPath + $hotMainFilename$;
    return fetch(requestPath)
      .then(res => res.text())
      .then(res => {
        if(typeof res === 'object') return res;
        else return JSON.parse(res);
      })
      .catch(e => {
        hotSetStatus('fail');
        throw(e);
      });
	}
};
