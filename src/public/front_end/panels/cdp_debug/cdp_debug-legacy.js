// @ts-nocheck
import * as CdpDebug from "./cdp_debug.js";
// 定义全局变量 CdpDebug
self.CdpDebug = self.CdpDebug || {};
// eslint-disable-next-line no-global-assign
CdpDebug = CdpDebug || {};
// 定义全局变量 CdpDebug.CustomPanel，对应 module.json 中 panel 插件的 className。在切换到 custom 模块时，调用 extension.instance() 新建 CustomPanel。
CdpDebug.CustomPanel = CdpDebug.CustomPanel.CustomPanel;
