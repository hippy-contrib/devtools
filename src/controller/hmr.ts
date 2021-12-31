import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import { HMREvent, WinstonColor, WSCode } from '@/@types/enum';
import { HMRWsParams } from '@/utils/url';
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
    ws.close(WSCode.InvalidRequestParams, reason);
    return logger.warn(reason);
  }

  const { Subscriber } = getDBOperator();
  const subscriber = new Subscriber(createHMRChannel(hash));
  subscriber.subscribe((msg) => {
    if (msg === hmrCloseEvent) {
      subscriber.unsubscribe();
      subscriber.disconnect();
      const reason = 'Hippy dev server closed, stop HMR!';
      ws.close(WSCode.HMRServerClosed, reason);
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
      const msgStr = msg.toString();
      const body: HMRBody = JSON.parse(msgStr);
      if (body.type === HMREvent.TransferFile) {
        saveHMRFiles(hash, body);
      } else {
        publisher.publish(msgStr);
      }
    } catch (e) {}
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
  type: HMREvent;
  data: unknown;
  params: unknown;
}

type TransFerFile = Array<{
  // include folder structure
  name: string;
  content: string;
}>;

async function saveHMRFiles(hash: string, hmrBody: HMRBody) {
  const files = hmrBody.data as TransFerFile;
  return Promise.all(
    files.map(async ({ name, content }) => {
      const fullFname = path.join(config.hmrStaticPath, hash, name);
      const cacheFolder = path.dirname(fullFname);
      await fs.promises.mkdir(cacheFolder, { recursive: true });
      return fs.promises.writeFile(fullFname, content);
    }),
  );
}
