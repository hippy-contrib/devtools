import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { TunnelEvent } from '@/@types/enum';
import deviceManager from '@/device-manager';
import { Logger } from '@/utils/log';
import { exec } from '@/utils/process';
import { addEventListener, exit, getDeviceList, selectDevice, sendMsg, tunnelStart } from './addon';
export { addEventListener, tunnelStart, getDeviceList, selectDevice, exit, sendMsg };

const childProcessLog = new Logger('child-process');
const log = new Logger('tunnel');
let proxyProcess;

export const tunnelEmitter = new EventEmitter();

export const startTunnel = (
  {
    port,
    iwdpPort,
    iwdpStartPort,
    iwdpEndPort,
    adbPath,
  }: {
    port: number;
    iwdpPort: number;
    iwdpStartPort: number;
    iwdpEndPort: number;
    adbPath?: string;
  },
  cb?,
) => {
  addEventListener((event, data) => {
    try {
      log.info(`receive tunnel event: ${event}`);
      if (event === TunnelEvent.ReceiveData) {
        tunnelEmitter.emit('message', data);
      } else {
        if ([TunnelEvent.RemoveDevice, TunnelEvent.AddDevice].indexOf(event) !== -1) {
          deviceManager.getDeviceList();
          if (event === TunnelEvent.AddDevice) {
            // 每次设备连接后，运行 adb reverse
            startAdbProxy(port);
          }
        } else if (event === TunnelEvent.AppConnect) {
          deviceManager.appDidConnect();
        } else if (event === TunnelEvent.AppDisconnect) {
          deviceManager.appDidDisConnect();
        } else if (event === TunnelEvent.TunnelLog) {
          if (data) log.info(data);
        }

        if (cb) cb(event, data);
      }
    } catch (e) {
      log.error(`handle tunnel event error: ${JSON.stringify(e)}`);
    }
  });

  adbPath ??= path.join(__dirname, '../build/adb');
  const iwdpParams = ['--no-frontend', `--config=null:${iwdpPort},:${iwdpStartPort}-${iwdpEndPort}`];
  tunnelStart(adbPath, iwdpParams, iwdpPort);
};

export const startIosProxy = ({ iwdpPort, iwdpStartPort, iwdpEndPort }) => {
  proxyProcess = spawn(
    'ios_webkit_debug_proxy',
    ['--no-frontend', `--config=null:${iwdpPort},:${iwdpStartPort}-${iwdpEndPort}`],
    { detached: false },
  );
  proxyProcess.unref();

  childProcessLog.info(`start IWDP on port ${iwdpPort}`);

  proxyProcess.on('error', (e) => {
    childProcessLog.info('IWDP error: %j', e);
  });
  proxyProcess.on('close', (code) => {
    childProcessLog.info(`IWDP close with code: ${code}`);
  });
};

export const startAdbProxy = (port: number) => {
  const adbPath = path.join(__dirname, '../build/adb');
  exec(adbPath, ['reverse', '--remove-all'])
    .then(() => exec(adbPath, ['reverse', `tcp:${port}`, `tcp:${port}`]))
    .catch((err: Error) => {
      childProcessLog.info('Port reverse failed, For iOS app log.info only just ignore the message.');
      childProcessLog.info('Otherwise please check adb devices command working correctly');
      childProcessLog.info(`type 'adb reverse tcp:${port} tcp:${port}' retry!`);
      childProcessLog.info('start adb reverse error: %j', err);
    });
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
