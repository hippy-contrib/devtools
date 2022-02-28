import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
// import { throttle } from '@/utils/throttle';
import { WinstonColor, WSCode, StaticFileStorage, ReportEvent, HMRReportExt2, HMRSyncType } from '@/@types/enum';
import { HMRWsParams } from '@/utils/url';
import { Logger } from '@/utils/log';
import { createHMRChannel } from '@/utils/pub-sub-channel';
import { getDBOperator } from '@/db';
import { config } from '@/config';
import { decodeHMRData } from '@/utils/buffer';
import { cosUpload } from '@/utils/cos';
import { aegis } from '@/utils/aegis';

const log = new Logger('hmr-controller', WinstonColor.Blue);
const hmrCloseEvent = 'HMR_SERVER_CLOSED';

export const onHMRClientConnection = async (ws: WebSocket, wsUrlParams: HMRWsParams) => {
  const { hash } = wsUrlParams;
  log.info('HMR client connected, hash: %s', hash);
  const { Subscriber, DB } = getDBOperator();
  const bundle = await new DB(config.redis.bundleTable).get(hash);
  if (!bundle) {
    const reason = 'Hippy dev server not started, not support HMR!';
    ws.close(WSCode.InvalidRequestParams, reason);
    return log.warn(reason);
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
      log.warn(reason);
    } else {
      log.info('receive HMR msg from redis: %s', msg);
      const msgObj = JSON.parse(msg.toString());
      if (msgObj.performance) {
        msgObj.performance.serverToApp = Date.now();
      }
      ws.send(JSON.stringify(msgObj));
    }
  });

  ws.on('close', (code, reason) => onClose(code, reason));
  ws.on('error', (e) => onClose(null, null, e));
  function onClose(code: number, reason: string, error?) {
    if (error) log.error('HMR client ws error: %s', error.stack || error);
    log.warn('HMR client ws closed, code: %s, reason: %s', code, reason);
    subscriber.unsubscribe();
    subscriber.disconnect();
  }
};

export const onHMRServerConnection = (ws: WebSocket, wsUrlParams: HMRWsParams) => {
  const { hash } = wsUrlParams;
  log.info('HMR server connected, hash: %s', hash);
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

  ws.on('message', async (msg: Buffer) => {
    try {
      const serverReceive = Date.now();
      const { emitList, ...emitJSON } = decodeHMRData(msg);
      if (emitJSON.performance) {
        const { hadSyncBundleResource } = emitJSON;
        const { pcToServer } = emitJSON.performance;
        const hmrSize = `${Math.ceil(msg.length / 1024)}KB`;
        const reportData = {
          name: ReportEvent.HMRPCToServer,
          duration: serverReceive - pcToServer,
          ext1: hmrSize,
          ext2: '',
        };
        if ('hadSyncBundleResource' in emitJSON)
          reportData.ext2 = hadSyncBundleResource ? HMRSyncType.Patch : HMRSyncType.FirstTime;
        aegis.reportTime(reportData);
      }

      await saveHMRFiles(hash, emitList);
      // throttledHMRFilesHandle(hash, emitList);
      // if (isThrottled()) {
      //   return logger.warn('HMR files is throttled within %s second', config.staticThrottleInterval / 1000);
      // }
      const msgStr = JSON.stringify(emitJSON);
      log.info('receive HMR msg from PC: %s', msgStr);
      if (emitJSON.messages?.length) publisher.publish(msgStr);
    } catch (e) {
      log.error('decodeHMRData failed: ', (e as any)?.stack || e);
    }
  });

  ws.on('close', (code, reason) => onClose(code, reason));
  ws.on('error', (e) => onClose(null, null, e));
  function onClose(code: number, reason: string, error?) {
    if (error) log.error('HMR server ws error: %s', error.stack || error);
    log.warn('HMR server ws closed, code: %s, reason: %s', code, reason);
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
  if (totalSize > config.maxStaticFileSize) {
    const error = `remote debug server accept max ${
      config.maxStaticFileSize / 1024 / 1024
    }MB of static resources, please minify you webpack output!`;
    log.error(error);
    throw new Error(error);
  }

  return Promise.all(
    emitList.map(async ({ name, content }) => {
      const saveFn = {
        [StaticFileStorage.COS]: saveHMRFileToCOS,
        [StaticFileStorage.Local]: saveHMRFileToLocal,
      }[config.staticFileStorage];
      return saveFn(hash, name, content);
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
