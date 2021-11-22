#!/usr/bin/env node
/* eslint-disable import/first -- 在入口最前面注册别名，因此禁用掉此规则 */
import moduleAlias from 'module-alias';
moduleAlias.addAliases({
  '@': __dirname,
  'package.json': '../package.json',
});
import yargs from 'yargs';
import { DevtoolsEnv, DBType } from '@/@types/enum';
import { Application } from '@/app';
import { Logger } from '@/utils/log';
import { version } from 'package.json';

const log = new Logger('entry');
const { argv } = yargs
  .alias('v', 'version')
  .describe('v', 'show version information')
  .alias('h', 'help')
  .help()
  .version()
  .option('dbType', {
    type: 'string',
    default: DBType.Memory,
    choices: [DBType.Memory, DBType.Redis],
    describe: 'Memory will use in memory db and mocked pub/sub emitter. othersize, will connect to remote redis server',
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
    descript: 'auto open chrome debug page',
  })
  .option('verbose', {
    type: 'boolean',
    default: false,
    describe: 'Output error details',
  })
  .option('iwdpPort', {
    type: 'number',
    default: 9000,
    describe: 'Device list port of ios_webkit_debug_proxy',
  })
  .option('iwdpStartPort', {
    type: 'number',
    default: 9200,
    describe: 'Start device port of ios_webkit_debug_proxy',
  })
  .option('iwdpEndPort', {
    type: 'number',
    default: 9300,
    describe: 'End device port of ios_webkit_debug_proxy',
  })
  .option('env', {
    type: 'string',
    default: DevtoolsEnv.Hippy,
    choices: [DevtoolsEnv.Hippy, DevtoolsEnv.Voltron, DevtoolsEnv.TDF, DevtoolsEnv.TDFCore],
  })
  .epilog(`Copyright (C) 2017-${new Date().getFullYear()} THL A29 Limited, a Tencent company.`) as any;

if (argv.help) {
  yargs.showHelp().exit(0, null);
}

if (argv.version) {
  yargs.version().exit(0, null);
}

log.info('version: %s', version);

Application.startServer({
  ...argv,
  startTunnel: true,
  startAdb: true,
  startIWDP: false,
});
