import * as i18n from '../../core/i18n/i18n.js';
import * as Root from '../../core/root/root.js';
import * as Panel from './Panel.js';
import * as ViewManager from './ViewManager.js';
let requestId = 0;
export const bindIframeEvent = (iframe) => {
    window.addEventListener('message', e => {
        const { cmd, id } = e.data;
        if (cmd === 'getParentUrl') {
            iframe.contentWindow?.postMessage({
                id,
                data: window.location.href,
            }, e.origin);
        }
        if (cmd === 'getRequestId') {
            requestId -= 1;
            iframe.contentWindow?.postMessage({
                id,
                data: requestId,
            }, e.origin);
        }
    }, false);
};
export const createPanel = (panelName, iframeUrl) => {
    return class CustomPanel extends Panel.Panel {
        iframe;
        static panelInstance;
        constructor() {
            super(panelName);
            this.iframe = document.createElement('iframe');
            this.iframe.setAttribute('src', iframeUrl);
            this.iframe.style.width = '100%';
            this.iframe.style.height = '100%';
            this.iframe.style.overflow = 'auto';
            this.contentElement.appendChild(this.iframe);
            bindIframeEvent(this.iframe);
        }
        static instance(opts = { forceNew: null }) {
            const { forceNew } = opts;
            if (!CustomPanel.panelInstance || forceNew) {
                CustomPanel.panelInstance = new CustomPanel();
            }
            return CustomPanel.panelInstance;
        }
    };
};
export const registerPanelView = ({ viewId, UIStrings, UIStringsKey, moduleName, customModulePath, tabName, order = 20, }) => {
    const str_ = i18n.i18n.registerUIStrings(UIStringsKey, UIStrings);
    const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
    let loadedCustomModule;
    async function loadCustomModule() {
        if (!loadedCustomModule) {
            await Root.Runtime.Runtime.instance().loadModulePromise(moduleName);
            loadedCustomModule = await import('../../' + customModulePath);
        }
        return loadedCustomModule;
    }
    const customTabs = JSON.parse(decodeURIComponent(new URL(location.href).searchParams.get('customTabs') || '[]'));
    if (customTabs.indexOf(tabName) === -1)
        return;
    ViewManager.registerViewExtension({
        location: "panel" /* PANEL */,
        id: viewId,
        title: i18nLazyString(UIStrings.custom),
        commandPrompt: i18nLazyString(UIStrings.showCustom),
        order,
        async loadView() {
            const Custom = await loadCustomModule();
            return Custom.CustomPanel.CustomPanel.instance();
        },
    });
};
//# sourceMappingURL=CustomPanel.js.map