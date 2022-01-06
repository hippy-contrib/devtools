import { Buffer } from 'buffer';
import { WinstonColor } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { EmitFile, isFileFieldLen, HMRData } from './constant';

const logger = new Logger('receiver', WinstonColor.Red);

export const decodeHMRData = (buf: Buffer) => {
  const offset = 0;
  const isFile = buf.readUInt8(offset);
  if (isFile) {
    const emitList = decodeEmitFiles(buf);
    return {
      isFile: true,
      emitList,
    };
  }
  const hmrBody = decodeEmitJSON(buf);
  return {
    isFile: false,
    hmrBody,
  };
};

const decodeEmitFiles = (buf: Buffer): EmitFile[] => {
  let offset = isFileFieldLen;
  const fileNum = buf.readUInt8(offset);
  offset += 1;
  const emitList = [];
  for (let i = 0; i < fileNum; i++) {
    const fnameLen = buf.readUInt8(offset);
    offset += 1;
    const name = buf.toString('utf8', offset, (offset += fnameLen));
    const lenOfLen = buf.readUInt8(offset);
    offset += 1;
    const fn = {
      1: 'readUInt8',
      2: 'readUInt16BE',
      4: 'readUInt32BE',
    }[lenOfLen];
    const fileLen = buf[fn](offset);
    offset += lenOfLen;
    const content = buf.slice(offset, (offset += fileLen));
    emitList.push({ name, content });
  }
  return emitList;
};

const decodeEmitJSON = (buf: Buffer): HMRData => {
  let offset = isFileFieldLen;
  const lenOfLen = buf.readUInt8(offset);
  offset += 1;
  const fn = {
    1: 'readUInt8',
    2: 'readUInt16BE',
    4: 'readUInt32BE',
  }[lenOfLen];
  const jsonLen = buf[fn](offset);
  offset += lenOfLen;
  const str = buf.toString('utf8', offset, offset + jsonLen);
  try {
    const emitJSON = JSON.parse(str);
    return emitJSON;
  } catch (e) {
    logger.error('decodeEmitJSON error: %j', (e as any).stack || e);
  }
};
