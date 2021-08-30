import path from 'path';

export const config = {
  cachePath: path.join(__dirname, 'cache'),
  env: '',
};

export const setConfig = (key, value) => {
  config[key] = value;
};
