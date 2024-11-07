/**
 * replace implement of webpack v5 runtime:
 *    __webpack_require__.hmrM: load manifest by fetch
 */
var $require$ = undefined;
 
module.exports = function() {
  $require$.hmrM = (requestTimeout) => {
    requestTimeout = requestTimeout || 10000;
    var requestPath = hotManifestPublicPath + __webpack_require__.hmrF();
    return fetch(requestPath)
       .then(res => {
         if(res.status === 404) return;
         if(!res.ok) throw new Error("Failed to fetch update manifest " + res.statusText);
         return res.text();
       })
      .then(res => {
        if(typeof res === 'object') return res;
        else return JSON.parse(res);
      });
  }
 };
 