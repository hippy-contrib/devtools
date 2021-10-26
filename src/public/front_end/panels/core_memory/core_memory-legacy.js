// @ts-nocheck
import * as CoreMemoryModule from "./core_memory.js";
// 定义全局变量 CoreMemory
self.CoreMemory = self.CoreMemory || {};
// eslint-disable-next-line no-global-assign
CoreMemory = CoreMemory || {};
// 定义全局变量 CoreMemory.CustomPanel，对应 module.json 中 panel 插件的 className。在切换到 custom 模块时，调用 extension.instance() 新建 CustomPanel。
CoreMemory.CustomPanel = CoreMemoryModule.CustomPanel.CustomPanel;
