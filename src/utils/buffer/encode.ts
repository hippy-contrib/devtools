import { Buffer } from 'buffer';
import { EmitFile, HMRWSData } from './constant';

export const encodeHMRData = (data: HMRWSData) => {
  const { emitList = [], ...emitJSON } = data;
  emitJSON.performance = {
    pcToServer: Date.now(),
  };
  const fileBuffer = encodeEmitFiles(emitList);
  const jsonBuffer = encodeEmitJSON(emitJSON);
  return Buffer.concat([jsonBuffer, fileBuffer]);
};

const encodeEmitFiles = (emitList: EmitFile[] = []) => {
  const fileNumLen = 1;
  const headBuf = Buffer.alloc(fileNumLen);
  headBuf.writeUInt8(emitList.length);

  const fileBuffers = emitList.map(genFileBufferWithLen);
  return Buffer.concat([headBuf, ...fileBuffers]);
};

const encodeEmitJSON = (data: unknown) => {
  const dataStr = JSON.stringify(data);
  const dataBuf = Buffer.from(dataStr);
  return genBufferWithLen(dataBuf);
};

function genFileBufferWithLen({ name, content }: EmitFile): Buffer {
  const nameBuf = Buffer.from(name);
  const len = 1 + nameBuf.length;
  const headBuf = Buffer.alloc(len);
  let offset = 0;
  headBuf.writeUInt8(nameBuf.length, offset);
  offset += 1;
  nameBuf.copy(headBuf, offset, 0);
  const fileBufferWithLen = genBufferWithLen(content);
  return Buffer.concat([headBuf, fileBufferWithLen]);
}

function getLenOfLen(len: number) {
  let lenOfLen = 1;
  if (len > 0xffff) lenOfLen = 4;
  else if (len > 0xff) lenOfLen = 2;
  return lenOfLen;
}

function genBufferWithLen(buf: Buffer): Buffer {
  const len = buf.length;
  const lenOfLen = getLenOfLen(len);
  const headBuf = Buffer.alloc(1 + lenOfLen);
  let offset = 0;
  headBuf.writeUInt8(lenOfLen, offset);
  const fn = {
    1: 'writeUInt8',
    2: 'writeUInt16BE',
    4: 'writeUInt32BE',
  }[lenOfLen];
  headBuf[fn](len, (offset += 1));
  return Buffer.concat([headBuf, buf]);
}
