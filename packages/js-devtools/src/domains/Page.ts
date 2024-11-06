import { getDomains } from '../lib/domain';
import connector from '../lib/connector';

export function getResourceTree() {
  const origins = getDomains();
  return {
    frameTree: {
      frame: {
        id: '0',
        mimeType: 'text/html',
        securityOrigin: 'http://localhost:38989',
        url: 'http://localhost:38989',
        secureContextType: 'Secure',
        crossOriginIsolatedContextType: 'NotIsolated',
        gatedAPIFeatures: [],
      },
      childFrames:
        origins.slice(0).map((origin, i) => ({
          frame: {
            id: `${i}`,
            parentId: '0',
            mimeType: 'text/html',
            securityOrigin: origin,
            url: origin,
            secureContextType: 'Secure',
            crossOriginIsolatedContextType: 'NotIsolatedFeatureDisabled',
            gatedAPIFeatures: [],
          },
          resources: [],
        })) || [],
      resources: [],
    },
  };
}

export const triggerFrameUpdated = () => {
  const body = getResourceTree();
  connector.trigger('Page.frameUpdated', body)
}
