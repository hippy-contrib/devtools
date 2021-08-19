// @ts-nocheck
import * as CustomModule from "./custom.js";
// 定义全局变量 Custom
self.Custom = self.Custom || {};
// eslint-disable-next-line no-global-assign
Custom = Custom || {};
// 定义全局变量 Custom.CustomPanel，对应 module.json 中 panel 插件的 className。在切换到 custom 模块时，调用 extension.instance() 新建 CustomPanel。
Custom.CustomPanel = CustomModule.CustomPanel.CustomPanel;
//# sourceMappingURL=custom-legacy.js.map