function parseURL(resourceQuery) {
  var options = {};

  if (typeof resourceQuery === 'string' && resourceQuery !== '') {
    var searchParams = resourceQuery.substr(1).split('&');

    for (var i = 0; i < searchParams.length; i++) {
      var pair = searchParams[i].split('=');
      options[pair[0]] = decodeURIComponent(pair[1]);
    }
  }

  return options;
}

export default parseURL;