import crypto from 'crypto';
import { machineIdSync } from 'node-machine-id';

export const getBundleVersionId = () => {
  const id = machineIdSync();
  const versionString = id + process.env.PWD;
  return crypto.createHash('md5').update(versionString).digest('hex');
};
