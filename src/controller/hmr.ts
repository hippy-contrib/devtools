import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import { WinstonColor, WSCode, StaticFileStorage } from '@/@types/enum';
import { HMRWsParams } from '@/utils/url';
import { Logger } from '@/utils/log';
import { createHMRChannel } from '@/utils/pub-sub-channel';
import { getDBOperator } from '@/db';
import { config } from '@/config';
import { decodeHMRData } from '@/utils/buffer';
import { cosUpload } from '@/utils/cos';

const logger = new Logger('hmr-controller', WinstonColor.Blue);
const hmrCloseEvent = 'HMR_SERVER_CLOSED';

export const onHMRClientConnection = async (ws: WebSocket, wsUrlParams: HMRWsParams) => {
  const { hash } = wsUrlParams;
  logger.info('HMR client connected, hash: %s', hash);
  const { Subscriber, DB } = getDBOperator();
  const bundle = await new DB(config.redis.bundleTable).get(hash);
  if (!bundle) {
    const reason = 'Hippy dev server not started, not support HMR!';
    ws.close(WSCode.InvalidRequestParams, reason);
    return logger.warn(reason);
  }

  const subscriber = new Subscriber(createHMRChannel(hash));
  subscriber.subscribe((msg) => {
    if (msg === hmrCloseEvent) {
      subscriber.unsubscribe();
      subscriber.disconnect();
      const reason = 'Hippy dev server closed, stop HMR!';
      ws.close(WSCode.HMRServerClosed, reason);
      logger.warn(reason);
    } else {
      logger.info('receive HMR msg from redis: %s', msg);
      ws.send(msg);
    }
  });

  ws.on('close', (code, reason) => onClose(code, reason));
  ws.on('error', (e) => onClose(null, null, e));
  function onClose(code: number, reason: string, error?) {
    if (error) logger.error('HMR client ws error: %s', error.stack || error);
    logger.warn('HMR client ws closed, code: %s, reason: %s', code, reason);
  }
};

export const onHMRServerConnection = (ws: WebSocket, wsUrlParams: HMRWsParams) => {
  const { hash } = wsUrlParams;
  logger.info('HMR server connected, hash: %s', hash);
  const { Publisher, DB } = getDBOperator();
  const model = new DB(config.redis.bundleTable);
  model.upsert(hash, { hash });
  const publisher = new Publisher(createHMRChannel(hash));

  ws.on('message', (msg: Buffer) => {
    try {
      const { isFile, emitList, hmrBody } = decodeHMRData(msg);
      if (isFile) {
        saveHMRFiles(hash, emitList);
      } else {
        const msgStr = JSON.stringify(hmrBody);
        logger.info('receive HMR server msg: %s', msgStr);
        publisher.publish(msgStr);
      }
    } catch (e) {
      logger.warn('decodeHMRData failed: ', (e as any)?.stack || e);
    }
  });

  ws.on('close', (code, reason) => onClose(code, reason));
  ws.on('error', (e) => onClose(null, null, e));
  function onClose(code: number, reason: string, error?) {
    if (error) logger.error('HMR server ws error: %s', error.stack || error);
    logger.warn('HMR server ws closed, code: %s, reason: %s', code, reason);
    publisher.publish(hmrCloseEvent);
    process.nextTick(() => {
      publisher.disconnect();
    });
    model.delete(hash);
  }
};

type TransFerFile = {
  // include folder structure
  name: string;
  content: Buffer;
};

async function saveHMRFiles(hash: string, emitList: TransFerFile[]) {
  return Promise.all(
    emitList.map(async ({ name, content }) => {
      const saveFn = {
        [StaticFileStorage.COS]: saveHMRFileToCOS,
        [StaticFileStorage.Local]: saveHMRFileToLocal,
      }[config.staticFileStorage];
      saveFn(hash, name, content);
    }),
  );
}

async function saveHMRFileToLocal(hash: string, name: string, content: Buffer) {
  const fullFname = path.join(config.hmrStaticPath, hash, name);
  const cacheFolder = path.dirname(fullFname);
  await fs.promises.mkdir(cacheFolder, { recursive: true });
  return fs.promises.writeFile(fullFname, content);
}

async function saveHMRFileToCOS(hash: string, name: string, content: Buffer) {
  const key = path.join(hash, name);
  cosUpload(key, content);
}
