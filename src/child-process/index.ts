import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { TunnelEvent, WinstonColor } from '@/@types/enum';
import { deviceManager } from '@/device-manager';
import { Logger } from '@/utils/log';
import { exec } from '@/utils/process';
import { addEventListener, tunnelStart } from './addon';

const childProcessLog = new Logger('child-process');
const log = new Logger('tunnel', WinstonColor.Magenta);
let proxyProcess;

export const tunnelEmitter = new EventEmitter();

export const startTunnel = (cb?) => {
  const { iwdpPort, iwdpStartPort, iwdpEndPort, adbPath } = global.appArgv;
  addEventListener((event, data) => {
    try {
      if (event !== TunnelEvent.TunnelLog) {
        log.info('tunnel event: %s', event);
      }
      if (event === TunnelEvent.ReceiveData) {
        tunnelEmitter.emit('message', data);
      } else {
        if ([TunnelEvent.RemoveDevice, TunnelEvent.AddDevice].indexOf(event) !== -1) {
          deviceManager.getDeviceList();
          if (event === TunnelEvent.AddDevice) {
            // 每次设备连接后，运行 adb reverse
            startAdbProxy();
          }
        } else if (event === TunnelEvent.AppConnect) {
          deviceManager.appDidConnect();
        } else if (event === TunnelEvent.AppDisconnect) {
          deviceManager.appDidDisConnect();
        } else if (event === TunnelEvent.TunnelLog && data) {
          log.info(data);
        }

        if (cb) cb(event, data);
      }
    } catch (e) {
      log.error(`handle tunnel event error: %s`, (e as Error)?.stack);
    }
  });

  let fullAdbPath = adbPath;
  fullAdbPath ??= path.join(__dirname, '../build/adb');
  const iwdpParams = ['--no-frontend', `--config=null:${iwdpPort},:${iwdpStartPort}-${iwdpEndPort}`];
  tunnelStart(fullAdbPath, iwdpParams, iwdpPort);
};

export const startIWDP = () => {
  const { iwdpPort, iwdpStartPort, iwdpEndPort } = global.appArgv;
  proxyProcess = spawn(
    'ios_webkit_debug_proxy',
    ['--no-frontend', `--config=null:${iwdpPort},:${iwdpStartPort}-${iwdpEndPort}`],
    { detached: false },
  );
  proxyProcess.unref();

  childProcessLog.info(`start IWDP on port ${iwdpPort}`);

  proxyProcess.on('error', (e) => {
    childProcessLog.info('IWDP error: %s', e?.stack);
  });
  proxyProcess.on('close', (code) => {
    childProcessLog.info(`IWDP close with code: ${code}`);
  });
};

export const startAdbProxy = async () => {
  const { port } = global.appArgv;
  const adbPath = path.join(__dirname, '../build/adb');
  try {
    await exec(adbPath, ['reverse', '--remove-all']);
    await exec(adbPath, ['reverse', `tcp:${port}`, `tcp:${port}`]);
  } catch (e) {
    childProcessLog.info('Port reverse failed, For iOS app log.info only just ignore the message.');
    childProcessLog.info('Otherwise please check adb devices command working correctly');
    childProcessLog.info(`type 'adb reverse tcp:${port} tcp:${port}' retry!`);
    childProcessLog.info('start adb reverse error: %s', (e as Error)?.stack);
  }
};

export const onExit = () => {
  if (!proxyProcess) return;
  childProcessLog.info('on log.info server exit, do some clean...');
  proxyProcess?.kill('SIGKILL');
  proxyProcess = null;
};
process.on('exit', onExit);
process.on('SIGINT', onExit);
process.on('SIGTERM', onExit);
