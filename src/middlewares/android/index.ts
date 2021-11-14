import { merge } from 'lodash';
import { cssMiddleWareManager } from '../common/css-middleware';
import { tdfHeapMiddleWareManager } from '../common/heap-middleware';
import { MiddleWareManager } from '../middleware-context';
import { tdfLogMiddleWareManager } from '../common/tdf-log-middleware';

export const androidMiddleWareManager: MiddleWareManager = merge(
  {},
  tdfHeapMiddleWareManager,
  tdfLogMiddleWareManager,
  cssMiddleWareManager,
);
