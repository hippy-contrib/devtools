export declare const bindIframeEvent: (iframe: HTMLIFrameElement) => void;
export declare const createPanel: (panelName: string, iframeUrl: string) => any;
declare type RegisterPanelOption = {
    viewId: string;
    UIStrings: any;
    UIStringsKey: string;
    moduleName: string;
    customModulePath: string;
    order?: number;
    tabName: string;
};
export declare const registerPanelView: ({ viewId, UIStrings, UIStringsKey, moduleName, customModulePath, tabName, order, }: RegisterPanelOption) => void;
export {};
