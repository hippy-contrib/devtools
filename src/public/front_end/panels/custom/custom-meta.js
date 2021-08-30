// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// import * as Common from '../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Root from '../../core/root/root.js';
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
const str_ = i18n.i18n.registerUIStrings('panels/custom/custom-meta.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedCustomModule;
async function loadCustomModule() {
    if (!loadedCustomModule) {
        // Side-effect import resources in module.json
        console.log(Root.Runtime.Runtime.instance());
        await Root.Runtime.Runtime.instance().loadModulePromise('panels/custom');
        loadedCustomModule = await import('./custom.js');
        console.log(loadedCustomModule);
    }
    return loadedCustomModule;
}
// function maybeRetrieveContextTypes<T = unknown>(getClassCallBack: (consoleModule: typeof Console) => T[]): T[] {
//   if (loadedConsoleModule === undefined) {
//     return [];
//   }
//   return getClassCallBack(loadedConsoleModule);
// }
const customTabs = JSON.parse(decodeURIComponent(new URL(location.href).searchParams.get('customTabs') || '[]'));
if (customTabs.indexOf('core-memory') !== -1) {
    UI.ViewManager.registerViewExtension({
        location: "panel" /* PANEL */ /* PANEL */,
        id: 'custom-core-memory',
        title: i18nLazyString(UIStrings.custom),
        commandPrompt: i18nLazyString(UIStrings.showCustom),
        order: 20,
        async loadView() {
            const Custom = await loadCustomModule();
            console.log(Custom);
            return Custom.CustomPanel.CustomPanel.instance();
        },
    });
}
//# sourceMappingURL=custom-meta.js.map