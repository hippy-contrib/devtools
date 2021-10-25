// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// import * as Common from '../core/common/common.js';
import * as UI from '../../ui/legacy/legacy.js';
const UIStrings = {
    /**
    *@description Title of the Console tool
    */
    custom: 'UI Inspector',
    /**
    *@description Title of an action that shows the console.
    */
    showCustom: 'Show UI Inspector',
};
UI.CustomPanel.registerPanelView({
    viewId: 'custom-ui-inspector',
    UIStrings,
    UIStringsKey: 'panels/ui_inspector/ui_inspector-meta.ts',
    moduleName: 'panels/ui_inspector',
    customModulePath: 'panels/ui_inspector/ui_inspector.js',
    tabName: 'ui_inspector',
});
//# sourceMappingURL=ui_inspector-meta.js.map