import { Buffer } from 'buffer';
import { WinstonColor } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { EmitFile, HMRWSData } from './constant';

const logger = new Logger('buffer-decoder', WinstonColor.Red);

export const decodeHMRData = (buf: Buffer): HMRWSData => {
  const { offset, emitJSON } = decodeEmitJSON(0, buf);
  const emitList = decodeEmitFiles(offset, buf);
  return {
    ...emitJSON,
    emitList,
  };
};

const decodeEmitFiles = (offset: number, buf: Buffer): EmitFile[] => {
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

const decodeEmitJSON = (
  offset = 0,
  buf: Buffer,
): {
  offset: number;
  emitJSON: Omit<HMRWSData, 'emitList'>;
} => {
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
  offset += jsonLen;
  try {
    const emitJSON = JSON.parse(str);
    return { emitJSON, offset };
  } catch (e) {
    logger.error('decodeEmitJSON error: %j', (e as any).stack || e);
    throw e;
  }
};
