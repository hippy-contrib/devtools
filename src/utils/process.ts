import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { Logger } from './log';

const log = new Logger('child-process');

export const exec = (cmd: string, argv?: string[], options?: SpawnOptionsWithoutStdio) =>
  new Promise((resolve, reject) => {
    const cp = spawn(cmd, argv, options);
    cp.stdout.on('data', (msg) => log.info(msg.toString()));
    cp.stderr.on('data', (err) => log.error(err.toString()));
    cp.on('error', (err) => {
      log.error('spawn child process error: %s', err.stack);
      reject(err);
    });
    cp.on('close', (code) => {
      if (code) {
        return reject(new Error(`Execting ${cmd} returns: ${code}`));
      }
    });
    return resolve(cp);
  });
