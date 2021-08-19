import path from 'path';

export const config = {
  cachePath: path.join(__dirname, 'cache'),
};

export const setConfig = (key, value) => {
  config[key] = value;
};
