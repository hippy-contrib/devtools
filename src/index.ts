/* eslint-disable import/first -- 本文件禁用，要在入口最前面注册别名，后面的 import 才能使用别名；另外要先加载 dotenv，才能创建 redis 连接 */
import moduleAlias from 'module-alias';
moduleAlias.addAliases({
  '@': __dirname,
  'package.json': '../package.json',
});
import { DevtoolsEnv, LogLevel } from '@/@types/enum';
import { DebugAppArgv } from '@/@types/app';
import { startDebugServer as oldStartDebugServer } from '@/app-debug';
import './process-handler';

export { webpack } from '@/app-dev';

export const startDebugServer = (options?: DebugAppArgv) => {
  global.debugAppArgv = {
    host: '0.0.0.0',
    port: 38989,
    static: '',
    entry: 'dist/dev/index.bundle',
    open: true,
    log: LogLevel.Info,
    env: DevtoolsEnv.Hippy,
    iWDPPort: 9000,
    iWDPStartPort: 9200,
    iWDPEndPort: 9300,
    ...(options || {}),
  };
  oldStartDebugServer();
};
