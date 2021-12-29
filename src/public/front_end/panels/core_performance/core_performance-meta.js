// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// import * as Common from '../core/common/common.js';
import * as UI from '../../ui/legacy/legacy.js';
const UIStrings = {
    /**
    *@description Title of the Console tool
    */
    custom: 'Core Performance',
    /**
    *@description Title of an action that shows the console.
    */
    showCustom: 'Show Core Performance',
};
UI.CustomPanel.registerPanelView({
    viewId: 'custom-core-performance',
    UIStrings,
    UIStringsKey: 'panels/core_performance/core_performance-meta.ts',
    moduleName: 'panels/core_performance',
    customModulePath: 'panels/core_performance/core_performance.js',
    tabName: 'core_performance',
});
