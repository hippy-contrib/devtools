import * as UI from '../../ui/legacy/legacy.js';
const panelName = 'core_performance';
const iframeUrl = '/extensions/core-performance.html';
export const CustomPanel = UI.CustomPanel.createPanel(panelName, iframeUrl);
