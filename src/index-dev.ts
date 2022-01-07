#!/usr/bin/env node
/* eslint-disable import/first -- 本文件禁用，要在入口最前面注册别名，后面的 import 才能使用别名；另外要先加载 dotenv，才能创建 redis 连接 */
import path from 'path';
import moduleAlias from 'module-alias';
moduleAlias.addAliases({
  '@': __dirname,
  'package.json': '../package.json',
});
import yargs from 'yargs';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, './.env') });
import { webpack } from '@/app-dev';
import { getWebpackConfig } from '@/utils/webpack';
import { Logger } from '@/utils/log';
import { version } from 'package.json';
import './process-handler';

const { argv } = yargs
  .alias('v', 'version')
  .describe('v', 'show version information ')
  .alias('h', 'help')
  .alias('c', 'config')
  .demand('config')
  .help()
  .version()
  .option('config', {
    type: 'string',
    default: '',
    describe: 'webpack config file ',
  })
  .epilog(`Copyright (C) 2017-${new Date().getFullYear()} THL A29 Limited, a Tencent company.`);

type Argv = typeof argv & {
  version: string;
  help: string;
  config: string;
};
const fullArgv = argv as Argv;
if (fullArgv.help) yargs.showHelp().exit(0, null);
if (fullArgv.version) yargs.version().exit(0, null);

const log = new Logger('entry');
log.info('version: %s', version);

(async () => {
  const webpackConfig = await getWebpackConfig(fullArgv.config);
  webpack(webpackConfig);
})();
