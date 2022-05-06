import fs from 'fs';

export const rmFolder = (fpath: string) => {
  try {
    fs.rmdirSync(fpath, { recursive: true });
  } catch (e) {
    if ((e as any).code !== 'ENOENT') console.error('rm dir error, %s', fpath);
  }
};