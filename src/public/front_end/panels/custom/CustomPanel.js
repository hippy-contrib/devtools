import * as UI from '../../ui/legacy/legacy.js';
let customPanelInstace;
let requestId = 0;
export class CustomPanel extends UI.Panel.Panel {
    constructor() {
        super('custom');
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', '/extensions/memory.html');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.overflow = 'auto';
        this.contentElement.appendChild(iframe);
        window.addEventListener('message', e => {
            if (e.data === 'getParentUrl') {
                iframe.contentWindow?.postMessage(window.location.href, e.origin);
            }
            if (e.data === 'getRequestId') {
                requestId -= 1;
                iframe.contentWindow?.postMessage(requestId, e.origin);
            }
        }, false);
    }
    static instance(opts = { forceNew: null }) {
        const { forceNew } = opts;
        if (!customPanelInstace || forceNew) {
            customPanelInstace = new CustomPanel();
        }
        return customPanelInstace;
    }
}
//# sourceMappingURL=CustomPanel.js.map