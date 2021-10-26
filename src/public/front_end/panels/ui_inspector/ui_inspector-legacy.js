// @ts-nocheck
import * as UIInspector from "./ui_inspector.js";
// 定义全局变量 UIInspector
self.UIInspector = self.UIInspector || {};
// eslint-disable-next-line no-global-assign
UIInspector = UIInspector || {};
// 定义全局变量 UIInspector.CustomPanel，对应 module.json 中 panel 插件的 className。在切换到 custom 模块时，调用 extension.instance() 新建 CustomPanel。
UIInspector.CustomPanel = UIInspector.CustomPanel.CustomPanel;
