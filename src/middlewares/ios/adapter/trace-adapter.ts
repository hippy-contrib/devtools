/**
 * jsc 的 trace 数据结构： JscStack
 * jsc 没 1ms 采样 1 次，JscTrace 表示一个采样点
 * JscFrame 表示当前采样点的调用栈，按叶节点到根节点排序
 *
 * v8 的 trace 数据结构：V8Stack，是一个一维数组
 * 用 PH 值表示调用栈的开始结束
 */

import { PH } from '@/@types/enum';
import { Logger } from '@/utils/log';

const log = new Logger('trace-adapter');
interface JscFrame {
  sourceID: string;
  name: string;
  line: number;
  column: number;
  url: string;
  expressionLocation: {
    line: number;
    column: number;
  };
}

interface JscTrace {
  timestamp: number;
  stackFrames: JscFrame[];
}

interface JscStack {
  timestamp: number;
  samples: {
    stackTraces: JscTrace[];
  };
}

interface V8Frame {
  args?: {
    name: string;
  };
  cat?: string;
  name: string;
  ph: PH;
  pid: number;
  tid: number;
  ts: number;
}

type V8Stack = V8Frame[];

interface JscTreeNode {
  id: string;
  data: JscFrame;
  children: JscTreeNode[];
  parent?: JscTreeNode;
  startTs: number; // 采样起始时间
  endTs: number; // 采样结束时间
}

// 理论上 1ms 采样 1 次，实际在 1ms 左右，这里按理论值绘图
const sampleInterval = 0.001;
const timeRatio = 1000000; // 单位：秒，转换为微秒，1s = 1000000 us

export default class TraceAdapter {
  private static newV8Frame(frame: JscFrame, { ph, ts }: { ph: PH; ts: number }) {
    return {
      name: frame.name || frame.url,
      ph,
      pid: 0,
      tid: 0,
      ts,
    };
  }

  private static getTraceEnd(trace: JscTrace, prevTrace: JscTrace) {
    const end = trace.stackFrames.length - 1;
    // 两 trace 采样间隔 1.5（含误差兼容）个 sampleInterval，认为是两棵树
    if (trace.timestamp - prevTrace.timestamp > sampleInterval * 1.5) return end;
    if (!prevTrace?.stackFrames) return end;

    const isSameFrame = (frame1, frame2) => !['sourceID', 'line', 'column'].some((key) => frame1[key] !== frame2[key]);

    for (let i = end, j = prevTrace.stackFrames.length - 1; i >= 0; i--, j--) {
      const frame = trace.stackFrames[i];
      const prevTraceFrame = prevTrace.stackFrames[j];
      if (prevTraceFrame)
        if (isSameFrame(frame, prevTraceFrame)) {
          continue;
        } else {
          return i;
        }
      else {
        return i;
      }
    }
    return -1;
  }

  /**
   * 深度优先遍历树，并将树结构转为类似于 [B, B, E, B, E, E] 的一维数组结构
   */
  private static dfs(tree: JscTreeNode, v8Frames: V8Frame[] = []): V8Frame[] {
    if (!tree) return [];
    const beginFrame = TraceAdapter.newV8Frame(tree.data, {
      ph: PH.Begin,
      ts: tree.startTs * timeRatio,
    });
    const endFrame = TraceAdapter.newV8Frame(tree.data, {
      ph: PH.End,
      ts: tree.endTs * timeRatio,
    });

    v8Frames.push(beginFrame);
    for (const child of tree.children) {
      TraceAdapter.dfs(child, v8Frames);
    }
    v8Frames.push(endFrame);
    return v8Frames;
  }

  /**
   * 要保证每一个调用栈 id 唯一，同一行代码有可能执行多次，需要加采样时间戳
   */
  private static getFrameId(frame, ts) {
    return `${ts}-${frame.sourceID}-${frame.line}-${frame.column}`;
  }

  private v8Json: V8Stack = [];
  private nodeMap: { [id: string]: JscTreeNode } = {};

  /**
   * 将 jsc 的 trace 数据转为 v8 的 trace 数据
   */
  public jsc2v8(json: JscStack): V8Stack {
    const traces = json.samples.stackTraces;
    const trees: JscTreeNode[] = [];
    let lastTree: JscTreeNode;
    let prevTrace;
    for (const trace of traces) {
      if (lastTree) {
        const end = TraceAdapter.getTraceEnd(trace, prevTrace);
        // 整个 trace 下的 frame 与前一帧没有共用的节点，说明该帧是一个新的调用栈，要构建为一颗单独的树
        if (end === trace.stackFrames.length - 1) {
          trees.push(lastTree);
          lastTree = this.buildTree(trace.stackFrames, trace.timestamp);
        } else if (end === -1) {
          // trace 和 prevTrace 完全重合，更新其 sampleNum
          this.updateSampleNum(trace, prevTrace, end);
        } else {
          // 有共用的节点，可添加到上一颗树，同时更新相同节点的 sampleNum
          this.appendToTree(trace, prevTrace, end);
          this.updateSampleNum(trace, prevTrace, end);
        }
      } else {
        lastTree = this.buildTree(trace.stackFrames, trace.timestamp);
      }
      prevTrace = trace;
    }
    trees.push(lastTree);
    for (const tree of trees) {
      const v8Frames = TraceAdapter.dfs(tree);
      if (v8Frames?.length) this.v8Json.push(...v8Frames);
    }
    return this.v8Json;
  }

  /**
   * 将一个 trace 构建为一棵 🌲
   */
  private buildTree(frames: JscFrame[], ts: number): JscTreeNode {
    let child;
    for (const frame of frames) {
      const id = TraceAdapter.getFrameId(frame, ts);
      const treeNode = {
        id,
        data: frame,
        children: child ? [child] : [],
        parent: null,
        startTs: ts,
        endTs: ts + sampleInterval,
      };
      this.nodeMap[id] = treeNode;
      if (child) child.parent = treeNode;
      child = treeNode;
    }
    return child;
  }

  /**
   * 将 trace 下的 frames [0, end] 范围内构建为子树，并追加到父节点下
   * end + 1 后的节点，是原有树共用的节点，更新器 sampleNum 值
   */
  private appendToTree(trace: JscTrace, prevTrace: JscTrace, end: number) {
    const frames = trace.stackFrames.slice(0, end + 1);
    const subTree = this.buildTree(frames, trace.timestamp);

    const parentNodeIndex = prevTrace.stackFrames.length - (trace.stackFrames.length - end - 1);
    const parentFrame = prevTrace.stackFrames[parentNodeIndex];
    let parentNode;
    if (parentFrame) parentNode = this.nodeMap[TraceAdapter.getFrameId(parentFrame, prevTrace.timestamp)];
    if (subTree && parentNode) {
      subTree.parent = parentNode;
      parentNode.children.push(subTree);
    } else {
      log.error('subTree not exist!');
    }
  }

  private updateSampleNum(trace: JscTrace, prevTrace: JscTrace, end: number) {
    let parentNodeIndex;
    if (end === -1) {
      parentNodeIndex = 0;
    } else {
      parentNodeIndex = prevTrace.stackFrames.length - (trace.stackFrames.length - end - 1);
    }
    const parentFrame = prevTrace.stackFrames[parentNodeIndex];
    let parentNode;
    if (parentFrame) parentNode = this.nodeMap[TraceAdapter.getFrameId(parentFrame, prevTrace.timestamp)];

    for (let i = parentNodeIndex; i < prevTrace.stackFrames.length; i++) {
      if (!parentNode) break;

      const id = TraceAdapter.getFrameId(prevTrace.stackFrames[i], prevTrace.timestamp);
      if (id === parentNode.id) {
        parentNode.endTs = trace.timestamp + sampleInterval;
        parentNode = parentNode.parent;
      } else {
        log.error('update frame sample time error, parent node not match!');
      }
    }
  }
}
