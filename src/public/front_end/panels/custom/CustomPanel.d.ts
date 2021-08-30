import * as UI from '../../ui/legacy/legacy.js';
export declare class CustomPanel extends UI.Panel.Panel {
    private iframe;
    constructor();
    static instance(opts?: {
        forceNew: null;
    }): CustomPanel;
    private bindEventListener;
}
