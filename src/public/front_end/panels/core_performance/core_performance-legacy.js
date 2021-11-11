// @ts-nocheck
import * as CorePerformance from "./core_performance.js";
// 定义全局变量 CorePerformance
self.CorePerformance = self.CorePerformance || {};
// eslint-disable-next-line no-global-assign
CorePerformance = CorePerformance || {};
// 定义全局变量 CorePerformance.CustomPanel，对应 module.json 中 panel 插件的 className。在切换到 custom 模块时，调用 extension.instance() 新建 CustomPanel。
CorePerformance.CustomPanel = CorePerformance.CustomPanel.CustomPanel;
