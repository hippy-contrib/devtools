import * as UI from '../../ui/legacy/legacy.js';
const panelName = 'vue_devtools';
const iframeUrl = '/extensions/vue-devtools.html';
export const CustomPanel = UI.CustomPanel.createPanel(panelName, iframeUrl);
