// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// import * as Common from '../core/common/common.js';
import * as UI from '../../ui/legacy/legacy.js';
const UIStrings = {
    /**
    *@description Title of the Console tool
    */
    custom: 'CDP Debug',
    /**
    *@description Title of an action that shows the console.
    */
    showCustom: 'Show CDP Debug',
};
UI.CustomPanel.registerPanelView({
    viewId: 'custom-cdp-debug',
    UIStrings,
    UIStringsKey: 'panels/cdp_debug/cdp_debug-meta.ts',
    moduleName: 'panels/cdp_debug',
    customModulePath: 'panels/cdp_debug/cdp_debug.js',
    tabName: 'cdp_debug',
});
