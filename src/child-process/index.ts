import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import open from 'open';
import { TunnelEvent, WinstonColor } from '@/@types/enum';
import { deviceManager } from '@/device-manager';
import { Logger } from '@/utils/log';
import { exec } from '@/utils/process';
import { addEventListener, tunnelStart } from './addon';

const childProcessLog = new Logger('child-process');
const tunnelLog = new Logger('tunnel', WinstonColor.Magenta);
let proxyProcess;

export const TUNNEL_EVENT = 'message';
export const tunnelEmitter = new EventEmitter();

export const startTunnel = (cb?: StartTunnelCallback) => {
  const { iWDPPort, iWDPStartPort, iWDPEndPort, adbPath } = global.appArgv;
  addEventListener((event: TunnelEvent, data: unknown) => {
    try {
      if (event !== TunnelEvent.TunnelLog) {
        tunnelLog.info('tunnel event: %s', event);
      }
      if (event === TunnelEvent.ReceiveData) {
        tunnelEmitter.emit(TUNNEL_EVENT, data);
      } else {
        if ([TunnelEvent.RemoveDevice, TunnelEvent.AddDevice].indexOf(event) !== -1) {
          deviceManager.getDeviceList();
          if (event === TunnelEvent.AddDevice) {
            // 每次设备连接后，运行 adb reverse
            startAdbProxy();
          }
        } else if (event === TunnelEvent.AppConnect) {
          deviceManager.onAppConnect();
        } else if (event === TunnelEvent.AppDisconnect) {
          deviceManager.onAppDisconnect();
        } else if (event === TunnelEvent.TunnelLog && data) {
          tunnelLog.info(data);
        }

        if (cb) cb(event, data);
      }
    } catch (e) {
      tunnelLog.error('handle tunnel event error: %s', (e as Error)?.stack);
    }
  });

  let fullAdbPath = adbPath;
  fullAdbPath ??= path.join(__dirname, '../build/adb');
  const iWDPParams = ['--no-frontend', `--config=null:${iWDPPort},:${iWDPStartPort}-${iWDPEndPort}`];
  tunnelStart(fullAdbPath, iWDPParams, iWDPPort);
};

export const startIWDP = () => {
  const { iWDPPort, iWDPStartPort, iWDPEndPort } = global.appArgv;
  proxyProcess = spawn(
    'ios_webkit_debug_proxy',
    ['--no-frontend', `--config=null:${iWDPPort},:${iWDPStartPort}-${iWDPEndPort}`],
    { detached: false },
  );
  proxyProcess.unref();

  childProcessLog.info(`start IWDP on port ${iWDPPort}`);

  proxyProcess.on('error', (e) => {
    childProcessLog.error('IWDP error: %s', e?.stack);
  });
  proxyProcess.on('close', (code) => {
    childProcessLog.warn(`IWDP close with code: ${code}`);
  });
};

export const startAdbProxy = async () => {
  const { port, hmrPort } = global.appArgv;
  const adbPath = path.join(__dirname, '../build/adb');
  try {
    await exec(adbPath, ['reverse', '--remove-all']);
    await exec(adbPath, ['reverse', `tcp:${port}`, `tcp:${port}`]);
    if (hmrPort) await exec(adbPath, ['reverse', `tcp:${hmrPort}`, `tcp:${hmrPort}`]);
  } catch (e) {
    childProcessLog.info('Port reverse failed, For iOS app log.info only just ignore the message.');
    childProcessLog.info('Otherwise please check adb devices command working correctly');
    childProcessLog.info(`type 'adb reverse tcp:${port} tcp:${port}' retry!`);
    if (hmrPort) childProcessLog.info(`type 'adb reverse tcp:${hmrPort} tcp:${hmrPort}' retry!`);
    childProcessLog.info('start adb reverse error: %s', (e as Error)?.stack);
  }
};

export const startChrome = async () => {
  const { host, port, open: openChrome } = global.appArgv;
  if (openChrome) {
    const url = `http://${host}:${port}/extensions/home.html`;
    try {
      open(url, { app: { name: open.apps.chrome } });
    } catch (e) {
      childProcessLog.error('open %s by chrome failed, please open manually, %s', url, (e as Error)?.stack);
    }
  }
};

export const killChildProcess = () => {
  if (!proxyProcess) return;
  childProcessLog.warn('on log.info server exit, do some clean...');
  proxyProcess?.kill('SIGKILL');
  proxyProcess = null;
};

type StartTunnelCallback = (event: TunnelEvent, data: unknown) => void;
