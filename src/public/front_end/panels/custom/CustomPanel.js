import * as UI from '../../ui/legacy/legacy.js';
let customPanelInstace;
let requestId = 0;
export class CustomPanel extends UI.Panel.Panel {
    iframe;
    constructor() {
        super('custom');
        this.iframe = document.createElement('iframe');
        this.iframe.setAttribute('src', '/extensions/memory.html');
        this.iframe.style.cssText = 'width: 100%; height: 100%; overflow: auto';
        this.contentElement.appendChild(this.iframe);
        this.bindEventListener();
    }
    static instance(opts = { forceNew: null }) {
        const { forceNew } = opts;
        if (!customPanelInstace || forceNew) {
            customPanelInstace = new CustomPanel();
        }
        return customPanelInstace;
    }
    bindEventListener() {
        window.addEventListener('message', e => {
            if (e.data === 'getParentUrl') {
                this.iframe.contentWindow?.postMessage(window.location.href, e.origin);
            }
            if (e.data === 'getRequestId') {
                requestId -= 1;
                this.iframe.contentWindow?.postMessage(requestId, e.origin);
            }
        }, false);
    }
}
//# sourceMappingURL=CustomPanel.js.map