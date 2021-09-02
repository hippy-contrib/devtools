import path from 'path';

export const config = {
  cachePath: path.join(__dirname, 'cache'),
  env: '',
  logPath: path.join(__dirname, 'log'),
};

export const setConfig = (key, value) => {
  config[key] = value;
};
