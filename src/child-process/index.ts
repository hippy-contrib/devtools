import { spawn } from 'child_process';
import createDebug from 'debug';
import { EventEmitter } from 'events';
import path from 'path';
import { TunnelEvent } from '../@types/enum';
import deviceManager from '../device-manager';
import { tunnel } from '../tunnel';
import { exec } from '../utils/process';
import { addEventListener, exit, getDeviceList, selectDevice, sendMsg, tunnelStart } from './addon';
export { addEventListener, tunnelStart, getDeviceList, selectDevice, exit, sendMsg };

const debug = createDebug('child-process');
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
      debug(`receive tunnel event: ${event}`);
      if (event === TunnelEvent.ReceiveData) {
        tunnel.onMessage(data);
      } else if (event === TunnelEvent.GetWebsocketPort) {
        tunnel.createTunnelClient();
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
        }

        if (cb) cb(event, data);
      }
    } catch (e) {
      console.error(`handle tunnel event error: ${JSON.stringify(e)}`);
    }
  });

  adbPath ??= path.join(__dirname, './build/adb');
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

  debug(`start IWDP on port ${iwdpPort}`);

  proxyProcess.on('error', (e) => {
    debug('IWDP error: %j', e);
  });
  proxyProcess.on('close', (code) => {
    debug(`IWDP close with code: ${code}`);
  });
};

export const startAdbProxy = (port: number) => {
  exec('adb', ['reverse', '--remove-all'])
    .then(() => exec('adb', ['reverse', `tcp:${port}`, `tcp:${port}`]))
    .catch((err: Error) => {
      debug('Port reverse failed, For iOS app debug only just ignore the message.');
      debug('Otherwise please check adb devices command working correctly');
      debug(`type 'adb reverse tcp:${port} tcp:${port}' retry!`);
      debug('start adb reverse error: %j', err);
    });
};

export const onExit = () => {
  if (!proxyProcess) return;
  debug('on debug server exit, do some clean...');
  proxyProcess?.kill('SIGKILL');
  proxyProcess = null;
};
process.on('exit', onExit);
process.on('SIGINT', onExit);
process.on('SIGTERM', onExit);
