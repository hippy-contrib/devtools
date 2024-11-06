import last from 'licia/last';
import toNum from 'licia/toNum';

export function getFetchSize(res: any, resTxt: string) {
  let size = 0;

  const contentLen = res?.headers?.['Content-Length'] || res?.headers?.['content-length'];

  if (contentLen) {
    size = toNum(contentLen);
  } else {
    size = lenToUtf8Bytes(resTxt);
  }

  return size;
}

export function getType(contentType: string) {
  if (!contentType)
    return {
      type: 'unknown',
      subType: 'unknown',
    };

  const type = contentType.split(';');

  return {
    type: type[0],
    subType: last(type),
  };
}

function lenToUtf8Bytes(str: string) {
  const m = encodeURIComponent(str).match(/%[89ABab]/g);

  return str.length + (m ? m.length : 0);
}
