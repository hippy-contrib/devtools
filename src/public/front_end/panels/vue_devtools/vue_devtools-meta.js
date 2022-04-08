// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// import * as Common from '../core/common/common.js';
import * as UI from '../../ui/legacy/legacy.js';
const UIStrings = {
    /**
    *@description Title of the Console tool
    */
    custom: 'Vue',
    /**
    *@description Title of an action that shows the console.
    */
    showCustom: 'Show Vue devtools',
};
UI.CustomPanel.registerPanelView({
    viewId: 'custom-vue-devtools',
    UIStrings,
    UIStringsKey: 'panels/vue_devtools/vue_devtools-meta.ts',
    moduleName: 'panels/vue_devtools',
    customModulePath: 'panels/vue_devtools/vue_devtools.js',
    tabName: 'vue_devtools',
});
