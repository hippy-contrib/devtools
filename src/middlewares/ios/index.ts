import { merge } from 'lodash';
import { cssMiddleWareManager } from '../common/css-middleware';
import { tdfHeapMiddleWareManager } from '../common/heap-middleware';
import { MiddleWareManager } from '../middleware-context';
import { tdfLogMiddleWareManager } from '../common/tdf-log-middleware';
import { debuggerMiddleWareManager } from './debugger-middleware';
import { heapMiddleWareManager } from './heap-middleware';
import { logMiddleWareManager } from './log-middleware';
import { runtimeMiddleWareManager } from './runtime-middleware';
import { traceMiddleWareManager } from './trace-middleware';

export const iOSMiddleWareManager: MiddleWareManager = merge(
  {},
  tdfHeapMiddleWareManager,
  tdfLogMiddleWareManager,
  debuggerMiddleWareManager,
  logMiddleWareManager,
  runtimeMiddleWareManager,
  traceMiddleWareManager,
  heapMiddleWareManager,
  cssMiddleWareManager,
);
