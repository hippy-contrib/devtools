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
UI.ViewManager.registerViewExtension({
    location: "panel" /* PANEL */ /* PANEL */,
    id: 'custom',
    title: i18nLazyString(UIStrings.custom),
    commandPrompt: i18nLazyString(UIStrings.showCustom),
    order: 20,
    async loadView() {
        const Custom = await loadCustomModule();
        console.log(Custom);
        return Custom.CustomPanel.CustomPanel.instance();
    },
});
// UI.ViewManager.registerViewExtension({
//     location: "drawer-view" /* DRAWER_VIEW */,
//     id: 'console-view',
//     title: i18nLazyString(UIStrings.console),
//     commandPrompt: i18nLazyString(UIStrings.showCustom),
//     persistence: "permanent" /* PERMANENT */,
//     order: 0,
//     async loadView() {
//         const Console = await loadConsoleModule();
//         return Console.ConsolePanel.WrapperView.instance();
//     },
// });
// UI.ActionRegistration.registerActionExtension({
//     actionId: 'custom.show',
//     category: UI.ActionRegistration.ActionCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.showConsole),
//     async loadActionDelegate() {
//         const Console = await loadConsoleModule();
//         return Console.ConsoleView.ActionDelegate.instance();
//     },
//     bindings: [
//         {
//             shortcut: 'Ctrl+`',
//             keybindSets: [
//                 "devToolsDefault" /* DEVTOOLS_DEFAULT */,
//                 "vsCode" /* VS_CODE */,
//             ],
//         },
//     ],
// });
// UI.ActionRegistration.registerActionExtension({
//     actionId: 'custom.clear',
//     category: UI.ActionRegistration.ActionCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.clearConsole),
//     iconClass: "largeicon-clear" /* LARGEICON_CLEAR */,
//     async loadActionDelegate() {
//         const Console = await loadConsoleModule();
//         return Console.ConsoleView.ActionDelegate.instance();
//     },
//     contextTypes() {
//         return maybeRetrieveContextTypes(Console => [Console.ConsoleView.ConsoleView]);
//     },
//     bindings: [
//         {
//             shortcut: 'Ctrl+L',
//         },
//         {
//             shortcut: 'Meta+K',
//             platform: "mac" /* Mac */,
//         },
//     ],
// });
// UI.ActionRegistration.registerActionExtension({
//     actionId: 'custom.clear.history',
//     category: UI.ActionRegistration.ActionCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.clearConsoleHistory),
//     async loadActionDelegate() {
//         const Console = await loadConsoleModule();
//         return Console.ConsoleView.ActionDelegate.instance();
//     },
// });
// UI.ActionRegistration.registerActionExtension({
//     actionId: 'custom.create-pin',
//     category: UI.ActionRegistration.ActionCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.createLiveExpression),
//     iconClass: "largeicon-visibility" /* LARGEICON_VISIBILITY */,
//     async loadActionDelegate() {
//         const Console = await loadConsoleModule();
//         return Console.ConsoleView.ActionDelegate.instance();
//     },
// });
// Common.Settings.registerSettingExtension({
//     category: Common.Settings.SettingCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.hideNetworkMessages),
//     settingName: 'hideNetworkMessages',
//     settingType: Common.Settings.SettingType.BOOLEAN,
//     defaultValue: false,
//     options: [
//         {
//             value: true,
//             title: i18nLazyString(UIStrings.hideNetworkMessages),
//         },
//         {
//             value: false,
//             title: i18nLazyString(UIStrings.showNetworkMessages),
//         },
//     ],
// });
// Common.Settings.registerSettingExtension({
//     category: Common.Settings.SettingCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.selectedContextOnly),
//     settingName: 'selectedContextFilterEnabled',
//     settingType: Common.Settings.SettingType.BOOLEAN,
//     defaultValue: false,
//     options: [
//         {
//             value: true,
//             title: i18nLazyString(UIStrings.onlyShowMessagesFromTheCurrent),
//         },
//         {
//             value: false,
//             title: i18nLazyString(UIStrings.showMessagesFromAllContexts),
//         },
//     ],
// });
// Common.Settings.registerSettingExtension({
//     category: Common.Settings.SettingCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.logXmlhttprequests),
//     settingName: 'monitoringXHREnabled',
//     settingType: Common.Settings.SettingType.BOOLEAN,
//     defaultValue: false,
// });
// Common.Settings.registerSettingExtension({
//     category: Common.Settings.SettingCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.showTimestamps),
//     settingName: 'consoleTimestampsEnabled',
//     settingType: Common.Settings.SettingType.BOOLEAN,
//     defaultValue: false,
//     options: [
//         {
//             value: true,
//             title: i18nLazyString(UIStrings.showTimestamps),
//         },
//         {
//             value: false,
//             title: i18nLazyString(UIStrings.hideTimestamps),
//         },
//     ],
// });
// Common.Settings.registerSettingExtension({
//     category: Common.Settings.SettingCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.autocompleteFromHistory),
//     settingName: 'consoleHistoryAutocomplete',
//     settingType: Common.Settings.SettingType.BOOLEAN,
//     defaultValue: true,
//     options: [
//         {
//             value: true,
//             title: i18nLazyString(UIStrings.autocompleteFromHistory),
//         },
//         {
//             value: false,
//             title: i18nLazyString(UIStrings.doNotAutocompleteFromHistory),
//         },
//     ],
// });
// Common.Settings.registerSettingExtension({
//     category: Common.Settings.SettingCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.groupSimilarMessagesInConsole),
//     settingName: 'consoleGroupSimilar',
//     settingType: Common.Settings.SettingType.BOOLEAN,
//     defaultValue: true,
//     options: [
//         {
//             value: true,
//             title: i18nLazyString(UIStrings.groupSimilarMessagesInConsole),
//         },
//         {
//             value: false,
//             title: i18nLazyString(UIStrings.doNotGroupSimilarMessagesIn),
//         },
//     ],
// });
// Common.Settings.registerSettingExtension({
//     category: Common.Settings.SettingCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.eagerEvaluation),
//     settingName: 'consoleEagerEval',
//     settingType: Common.Settings.SettingType.BOOLEAN,
//     defaultValue: true,
//     options: [
//         {
//             value: true,
//             title: i18nLazyString(UIStrings.eagerlyEvaluateConsolePromptText),
//         },
//         {
//             value: false,
//             title: i18nLazyString(UIStrings.doNotEagerlyEvaluateConsole),
//         },
//     ],
// });
// Common.Settings.registerSettingExtension({
//     category: Common.Settings.SettingCategory.CONSOLE,
//     title: i18nLazyString(UIStrings.evaluateTriggersUserActivation),
//     settingName: 'consoleUserActivationEval',
//     settingType: Common.Settings.SettingType.BOOLEAN,
//     defaultValue: true,
//     options: [
//         {
//             value: true,
//             title: i18nLazyString(UIStrings.treatEvaluationAsUserActivation),
//         },
//         {
//             value: false,
//             title: i18nLazyString(UIStrings.doNotTreatEvaluationAsUser),
//         },
//     ],
// });
// Common.Revealer.registerRevealer({
//     contextTypes() {
//         return [
//             Common.Console.Console,
//         ];
//     },
//     async loadRevealer() {
//         const Console = await loadConsoleModule();
//         return Console.ConsolePanel.ConsoleRevealer.instance();
//     },
//     destination: undefined,
// });
//# sourceMappingURL=console-meta.js.map
//# sourceMappingURL=custom-meta.js.map