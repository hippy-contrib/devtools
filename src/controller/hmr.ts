import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import { HMREvent, WinstonColor } from '@/@types/enum';
import { HMRWsParams } from '@/utils/url';
import { WS_CLOSE_REASON } from '@/@types/constants';
import { Logger } from '@/utils/log';
import { createHMRChannel } from '@/utils/pub-sub-channel';
import { getDBOperator } from '@/db';
import { config } from '@/config';
import { BundleManager } from './bundles';

const logger = new Logger('hmr-controller', WinstonColor.Blue);
const hmrCloseEvent = 'HMR_SERVER_CLOSED';

export const onHMRClientConnection = async (ws: WebSocket, wsUrlParams: HMRWsParams) => {
  const { hash } = wsUrlParams;
  const bundle = await BundleManager.get(hash);
  if (!bundle) {
    const reason = 'Hippy dev server not started, not support HMR!';
    ws.close(WS_CLOSE_REASON, reason);
    return logger.warn(reason);
  }

  const { Subscriber } = getDBOperator();
  const subscriber = new Subscriber(createHMRChannel(hash));
  subscriber.subscribe((msg) => {
    if (msg === hmrCloseEvent) {
      subscriber.unsubscribe();
      subscriber.disconnect();
      const reason = 'Hippy dev server closed, stop HMR!';
      ws.close(WS_CLOSE_REASON, reason);
      logger.warn(reason);
    } else {
      ws.send(msg);
    }
  });
};

export const onHMRServerConnection = (ws: WebSocket, wsUrlParams: HMRWsParams) => {
  const { hash } = wsUrlParams;
  BundleManager.add({ hash });
  const { Publisher } = getDBOperator();
  const publisher = new Publisher(createHMRChannel(hash));

  ws.on('message', (msg) => {
    try {
      const body: HMRBody = JSON.parse(msg.toString());
      if (body.event === HMREvent.TransferFile) {
        saveHMRFiles(hash, body);
      } else {
        publisher.publish(body.body);
      }
    } catch (e) {}
    publisher.publish(msg.toString());
  });

  ws.on('close', close);
  ws.on('error', close);
  function close(e) {
    if (e) logger.error('hmr server ws error: %s', e.stack || e);
    publisher.publish(hmrCloseEvent);
    process.nextTick(() => {
      publisher.disconnect();
    });
    BundleManager.remove(hash);
  }
};

interface HMRBody {
  event: HMREvent;
  body: string;
  files?: Array<{
    // include folder structure
    filename: string;
    body: string;
  }>;
}

async function saveHMRFiles(hash: string, hmrBody: HMRBody) {
  return Promise.all(
    hmrBody.files.map(async ({ filename, body }) => {
      const fullFname = path.join(config.hmrStaticPath, hash, filename);
      const cacheFolder = path.dirname(fullFname);
      await fs.promises.mkdir(cacheFolder, { recursive: true });
      return fs.promises.writeFile(fullFname, body);
    }),
  );
}
