// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// import * as Common from '../core/common/common.js';
import * as UI from '../../ui/legacy/legacy.js';
const UIStrings = {
    /**
    *@description Title of the Console tool
    */
    custom: 'Core Memory',
    /**
    *@description Title of an action that shows the console.
    */
    showCustom: 'Show Custom',
};
UI.CustomPanel.registerPanelView({
    viewId: 'custom-core-memory',
    UIStrings,
    UIStringsKey: 'panels/core_memory/core_memory-meta.ts',
    moduleName: 'panels/core_memory',
    customModulePath: 'panels/core_memory/core_memory.js',
    tabName: 'core-memory',
});
//# sourceMappingURL=core_memory-meta.js.map