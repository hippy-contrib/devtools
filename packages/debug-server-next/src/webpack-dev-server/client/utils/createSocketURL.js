import url from 'url';

function createSocketURL(parsedURL) {
  var protocol = parsedURL.protocol,
      hostname = parsedURL.hostname,
      port = parsedURL.port,
      pathname = parsedURL.pathname,
      hash = parsedURL.hash,
      role = parsedURL.role;
  return url.format({
    protocol: protocol || 'ws:',
    hostname: hostname || 'localhost',
    port: port,
    pathname: pathname || '/ws',
    slashes: true,
    query: {
      hash: hash,
      role: role
    }
  });
}

export default createSocketURL;