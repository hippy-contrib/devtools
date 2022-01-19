import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
// import { throttle } from '@/utils/throttle';
import { WinstonColor, WSCode, StaticFileStorage, ReportEvent, HMRReportExt2 } from '@/@types/enum';
import { HMRWsParams } from '@/utils/url';
import { Logger } from '@/utils/log';
import { createHMRChannel } from '@/utils/pub-sub-channel';
import { getDBOperator } from '@/db';
import { config } from '@/config';
import { decodeHMRData } from '@/utils/buffer';
import { cosUpload } from '@/utils/cos';
import { aegis } from '@/utils/aegis';

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
  aegis.reportEvent({
    name: ReportEvent.RemoteHMR,
    ext1: hash,
    ext2: HMRReportExt2.Client,
  });

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
    subscriber.unsubscribe();
    subscriber.disconnect();
  }
};

export const onHMRServerConnection = (ws: WebSocket, wsUrlParams: HMRWsParams) => {
  const { hash } = wsUrlParams;
  logger.info('HMR server connected, hash: %s', hash);
  const { Publisher, DB } = getDBOperator();
  const model = new DB(config.redis.bundleTable);
  model.upsert(hash, { hash });
  const publisher = new Publisher(createHMRChannel(hash));
  aegis.reportEvent({
    name: ReportEvent.RemoteHMR,
    ext1: hash,
    ext2: HMRReportExt2.Server,
  });
  // const { throttledFn: throttledHMRFilesHandle, isThrottled } = throttle((hash, emitList) => {
  //   saveHMRFiles(hash, emitList);
  //   return Date.now();
  // }, config.staticThrottleInterval);

  ws.on('message', (msg: Buffer) => {
    try {
      const { isFile, emitList, hmrBody } = decodeHMRData(msg);
      logger.info('speed %s', Date.now(), `${Math.ceil(msg.length / 1024)}KB`);
      if (isFile) {
        // throttledHMRFilesHandle(hash, emitList);
        // if (isThrottled()) {
        //   return logger.warn('HMR files is throttled within %s second', config.staticThrottleInterval / 1000);
        // }
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
  const totalSize = emitList.reduce((prev, curr) => (prev += curr.content.length), 0);
  if (totalSize > config.maxStaticFileSize)
    return logger.warn(
      `remote debug server accept max ${
        config.maxStaticFileSize / 1024 / 1024
      }MB of static resources, please minify you webpack output!`,
    );

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
