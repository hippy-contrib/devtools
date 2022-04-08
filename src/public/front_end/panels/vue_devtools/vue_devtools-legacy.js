// @ts-nocheck
import * as VueDevtools from "./vue_devtools.js";
// 定义全局变量 VueDevtools
self.VueDevtools = self.VueDevtools || {};
// eslint-disable-next-line no-global-assign
VueDevtools = VueDevtools || {};
// 定义全局变量 VueDevtools.CustomPanel，对应 module.json 中 panel 插件的 className。在切换到 custom 模块时，调用 extension.instance() 新建 CustomPanel。
VueDevtools.CustomPanel = VueDevtools.CustomPanel.CustomPanel;
