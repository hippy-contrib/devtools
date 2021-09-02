import { spawn } from 'child_process';
import { Logger } from './log';

const log = new Logger('child-process');

export const exec = (cmd: string, argv: any, options?: any) =>
  new Promise((resolve, reject) => {
    const cp = spawn(cmd, argv, options);
    cp.stdout.on('data', (msg: any) => log.info(msg.toString()));
    cp.stderr.on('data', (err: any) => log.error(err.toString()));
    cp.on('error', (err: any) => {
      log.error(err);
      reject(err);
    });
    cp.on('close', (code: any) => {
      if (code) {
        return reject(new Error(`Execting ${cmd} returns: ${code}`));
      }
    });
    return resolve(cp);
  });
