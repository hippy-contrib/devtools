import { merge } from 'lodash';
import { cssMiddleWareManager } from '../common/css-middleware';
import { tdfHeapMiddleWareManager } from '../common/heap-middleware';
import { MiddleWareManager } from '../middleware-context';
import { tdfLogMiddleWareManager } from '../common/tdf-log-middleware';
import { tdfRuntimeMiddleWareManager } from '../common/tdf-runtime-middleware';

export const androidMiddleWareManager: MiddleWareManager = merge(
  {},
  tdfHeapMiddleWareManager,
  tdfLogMiddleWareManager,
  cssMiddleWareManager,
  tdfRuntimeMiddleWareManager,
);
