import each from 'licia/each';
import { getCookieAPI } from './Network';
import { getDomains } from '../lib/domain';

export function getUsageAndQuota() {
  return {
    quota: 0,
    usage: 0,
    usageBreakdown: [],
  };
}

export function clearDataForOrigin(params: any) {
  const storageTypes = params.storageTypes.split(',');

  const origins = getDomains();

  each(storageTypes, async type => {
    if (type === 'cookies') {
      const Cookie = getCookieAPI()
      if(Cookie) {
        origins.forEach(origin => {
          Cookie.set(origin, '');
        });
      }
    } else if (type === 'local_storage') {
      localStorage.clear();
    }
  });
}
