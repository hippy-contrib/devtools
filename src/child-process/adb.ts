import path from 'path';
import os from 'os';
import fs from 'fs';
import { exec } from '@/utils/process';
import { WinstonColor, OSType } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { config } from '@/config';

let hmrPort;
const log = new Logger('adb', WinstonColor.Magenta);

export const startAdbProxy = async () => {
  if (!hmrPort) {
    try {
      const data = fs.readFileSync(config.hmrPortPath);
      hmrPort = data.toString();
    } catch (e) {
      log.warn('hmrPort file does not exist.');
    }
  }
  const { port } = global.debugAppArgv || {};
  const adbRelatePath = {
    [OSType.Darwin]: '../build/mac/adb',
    [OSType.Windows]: '../build/win/adb.exe',
  }[os.type()];
  const adbPath = path.join(__dirname, adbRelatePath);
  try {
    if (port) await exec(adbPath, ['reverse', `tcp:${port}`, `tcp:${port}`]);
    if (hmrPort) await exec(adbPath, ['reverse', `tcp:${hmrPort}`, `tcp:${hmrPort}`]);
  } catch (e) {
    log.info('Port reverse failed, For iOS app log.info only just ignore the message.');
    log.info(`Otherwise please check 'adb devices' command working correctly`);
    if (port) log.info(`type 'adb reverse tcp:${port} tcp:${port}' retry!`);
    if (hmrPort) log.info(`type 'adb reverse tcp:${hmrPort} tcp:${hmrPort}' retry!`);
    log.info('start adb reverse error: %s', (e as Error)?.stack);
  }
};
