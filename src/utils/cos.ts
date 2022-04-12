import Stream from 'stream';
import COS from 'cos-nodejs-sdk-v5';
import { Logger } from '@/utils/log';
import { config } from '@/config';
import { ReportEvent } from '@/@types/enum';
import { timeStart } from '@/utils/aegis';

const log = new Logger('cos-util');
const baseCosOption = {
  Domain: '{Bucket}.cos-internal.{Region}.tencentcos.cn',
};

export const enum COSErrorCode {
  ParamsMiss = -1,
  UploadStreamError = -2,
  UploadError = -3,
  EmptyFileError = -4,
}
const ErrorMsg = {
  [COSErrorCode.ParamsMiss]: '参数缺失（origin，passWord，filePath，stream是必填参数）',
  [COSErrorCode.UploadStreamError]: '上传失败（流处理异常）',
  [COSErrorCode.UploadError]: '上传失败',
  [COSErrorCode.EmptyFileError]: '文件为空, 已忽略',
};

export const cosUpload = (key: string, buffer: Buffer) =>
  cosUploadByBuffer({
    SecretId: config.cos.SecretId,
    SecretKey: config.cos.SecretKey,
    Bucket: config.cos.Bucket,
    Region: config.cos.Region,
    Key: key,
    buffer,
  });

export const cosUploadByBuffer = function (options: COSUploadByBufferOptions) {
  const { SecretId, SecretKey, Bucket, Region, Key, buffer, StorageClass = 'STANDARD', onProgress } = options;
  const timeEnd = timeStart(ReportEvent.COSUpload);
  return new Promise((resolve, reject) => {
    const client = new COS({
      ...baseCosOption,
      SecretId,
      SecretKey,
    });
    client.putObject(
      {
        Bucket,
        Region,
        Key,
        StorageClass,
        Body: buffer,
        onProgress: onProgress ? onProgress : () => {},
      },
      (err, data) => {
        timeEnd({
          ext1: `${Math.ceil(buffer.length / 1024)}KB`,
        });
        if (err) {
          reject({
            code: COSErrorCode.UploadError,
            msg: ErrorMsg[COSErrorCode.UploadError],
          });
        } else {
          log.info('upload to cos suc, location: %s, statusCode %s', data.Location, data.statusCode);
          resolve({
            code: 0,
            msg: '',
            data,
          });
        }
      },
    );
  });
};

export const cosUploadByStream = function (options: COSUploadByStreamOptions) {
  const { SecretId, SecretKey, Bucket, Region, Key, stream, StorageClass = 'STANDARD', onProgress } = options;
  return new Promise((resolve, reject) => {
    if (Boolean(SecretId && SecretKey && Bucket && Region && Key && stream) === false) {
      reject({
        code: COSErrorCode.ParamsMiss,
        msg: ErrorMsg[COSErrorCode.ParamsMiss],
      });
      return;
    }
    const chunkArr = [];
    stream.on('data', (chunk) => {
      chunkArr.push(chunk);
    });
    stream.on('end', async () => {
      const buffer = Buffer.concat(chunkArr);
      const byteSize = buffer.byteLength;
      if (byteSize === 0) {
        reject({
          code: COSErrorCode.EmptyFileError,
          msg: ErrorMsg[COSErrorCode.EmptyFileError],
        });
        return;
      }
      cosUploadByBuffer({
        SecretId,
        SecretKey,
        Bucket,
        Region,
        Key,
        buffer,
        StorageClass,
        onProgress,
      })
        .then(resolve)
        .catch(reject);
    });
    stream.on('error', (err) => {
      log.error('upload cos error: %j', err);
      reject({
        code: COSErrorCode.UploadStreamError,
        msg: ErrorMsg[COSErrorCode.UploadStreamError],
      });
    });
  });
};

export const deleteObjects = function (keys: string[]) {
  const { SecretId } = config.cos;
  const { SecretKey } = config.cos;
  const { Bucket } = config.cos;
  const { Region } = config.cos;
  const client = new COS({
    ...baseCosOption,
    SecretId,
    SecretKey,
  });
  return new Promise((resolve, reject) => {
    client.deleteMultipleObject(
      {
        Bucket,
        Region,
        Objects: keys.map((Key) => ({ Key })),
      },
      (err, data) => {
        if (err) return reject(err);
        resolve(data);
      },
    );
  });
};

type COSUploadBaseOptions = {
  SecretId: string;
  SecretKey: string;
  Bucket: string;
  Region: string;
  Key: string;
  StorageClass?: COS.StorageClass;
  onProgress?: (progressData: unknown) => void;
};

type COSUploadByStreamOptions = COSUploadBaseOptions & {
  stream: Stream;
};

type COSUploadByBufferOptions = COSUploadBaseOptions & {
  buffer: Buffer;
};
