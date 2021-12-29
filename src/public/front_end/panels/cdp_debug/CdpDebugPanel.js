import * as UI from '../../ui/legacy/legacy.js';
const panelName = 'cdp_debug';
const iframeUrl = '/extensions/cdp-debug.html';
export const CustomPanel = UI.CustomPanel.createPanel(panelName, iframeUrl);
