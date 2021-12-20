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
import { DevtoolsEnv, DBType } from '@/@types/enum';
import { startServer } from '@/app';
import { Logger } from '@/utils/log';
import { version } from 'package.json';
import './process-handler';

const { argv } = yargs
  .alias('v', 'version')
  .alias('h', 'help')
  .alias('c', 'config')
  .help()
  .version()
  .option('dbType', {
    type: 'string',
    default: DBType.Memory,
    choices: [DBType.Memory, DBType.Redis],
    describe: 'Localhost debug server please select memory. Remote debug server please select redis.',
  })
  .option('entry', {
    type: 'string',
    default: 'dist/dev/index.bundle',
    describe: 'Path of the jsbundle for debugging',
  })
  .option('static', {
    type: 'string',
    describe: 'Path of the static files such as images',
  })
  .option('host', {
    type: 'string',
    default: 'localhost',
    describe: 'The host the debug server will listen to',
  })
  .option('port', {
    type: 'number',
    default: 38989,
    describe: 'The port the debug server will listen to',
  })
  .option('open', {
    type: 'boolean',
    default: true,
    descript: 'Auto open chrome debug page',
  })
  .option('verbose', {
    type: 'boolean',
    default: false,
    describe: 'Output error details',
  })
  .option('config', {
    type: 'string',
    default: '',
    describe: 'webpack config file',
  })
  .option('iWDPPort', {
    type: 'number',
    default: 9000,
    describe: 'Device list port of ios_webkit_debug_proxy',
  })
  .option('iWDPStartPort', {
    type: 'number',
    default: 9200,
    describe: 'Start device port of ios_webkit_debug_proxy',
  })
  .option('iWDPEndPort', {
    type: 'number',
    default: 9300,
    describe: 'End device port of ios_webkit_debug_proxy',
  })
  .option('env', {
    type: 'string',
    default: DevtoolsEnv.Hippy,
    choices: [DevtoolsEnv.Hippy, DevtoolsEnv.Voltron, DevtoolsEnv.TDF, DevtoolsEnv.TDFCore],
  })
  .option('isRemote', {
    type: 'boolean',
    default: false,
    describe: 'Whether use remote debug',
  })
  .epilog(`Copyright (C) 2017-${new Date().getFullYear()} THL A29 Limited, a Tencent company.`);

type Argv = typeof argv & {
  version: string;
  help: string;
};
const fullArgv = argv as Argv;
if (fullArgv.help) yargs.showHelp().exit(0, null);
if (fullArgv.version) yargs.version().exit(0, null);

global.appArgv = fullArgv;

const log = new Logger('entry');
log.info('version: %s', version);

startServer();
