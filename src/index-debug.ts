#!/usr/bin/env node
/* eslint-disable import/first -- 本文件禁用，要在入口最前面注册别名，后面的 import 才能使用别名；另外要先加载 dotenv，才能创建 redis 连接 */
import path from 'path';
import moduleAlias from 'module-alias';
moduleAlias.addAliases({
  '@': __dirname,
});
import yargs from 'yargs';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, './.env') });
import { DevtoolsEnv, DebugTunnel, LogLevel } from '@/@types/enum';
import { DebugAppArgv } from '@/@types/app.d';

const { argv } = yargs
  .alias('v', 'version')
  .alias('h', 'help')
  .help()
  .version()
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
    default: '0.0.0.0',
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
    describe: 'Auto open chrome debug page',
  })
  .option('log', {
    type: 'string',
    default: LogLevel.Info,
    describe: 'Log level',
    choices: Object.values(LogLevel),
  })
  .option('iWDPPort', {
    type: 'number',
    default: 9000,
    describe: 'Device list port of ios_webkit_debug_proxy',
  })
  .option('iWDPStartPort', {
    type: 'number',
    default: 9200,
    describe: 'Start port of ios_webkit_debug_proxy for iOS device',
  })
  .option('iWDPEndPort', {
    type: 'number',
    default: 9300,
    describe: 'End port of ios_webkit_debug_proxy for iOS device',
  })
  .option('env', {
    type: 'string',
    default: DevtoolsEnv.Hippy,
    describe: 'Debug framework',
    choices: [DevtoolsEnv.Hippy, DevtoolsEnv.TDFCore, DevtoolsEnv.HippyTDF],
  })
  .option('tunnel', {
    type: 'string',
    describe: 'Debug protocol transport, by default Hippy use WS, TDFCore use TCP, HippyTDF use WS',
    choices: [DebugTunnel.WS, DebugTunnel.TCP],
  })
  .epilog(`Copyright (C) 2017-${new Date().getFullYear()} THL A29 Limited, a Tencent company.`);

global.debugAppArgv = argv as unknown as DebugAppArgv;
if (debugAppArgv.help) yargs.showHelp().exit(0, null);
if (debugAppArgv.version) yargs.version().exit(0, null);

/**
 * import after global.debugAppArgv is set
 */
import '@/utils/aegis';
import { Logger } from '@/utils/log';
import { startDebugServer } from '@/app-debug';
import { version } from '../package.json';
import './process-handler';
const log = new Logger('entry');
log.info('version: %s', version);

startDebugServer();
