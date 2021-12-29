import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as HAR from '../har/har.js';
import type * as TextUtils from '../text_utils/text_utils.js';
import * as Workspace from '../workspace/workspace.js';
import { ExtensionSidebarPane } from './ExtensionPanel.js';
import type { TracingSession } from './ExtensionTraceProvider.js';
import { ExtensionTraceProvider } from './ExtensionTraceProvider.js';
import { PrivateAPI } from './ExtensionAPI.js';
declare global {
    interface Window {
        DevToolsAPI?: {
            getInspectedTabId?(): string | undefined;
        };
    }
}
export declare class ExtensionServer extends Common.ObjectWrapper.ObjectWrapper {
    _clientObjects: Map<string, unknown>;
    _handlers: Map<string, (message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort) => unknown>;
    _subscribers: Map<string, Set<MessagePort>>;
    _subscriptionStartHandlers: Map<string, () => unknown>;
    _subscriptionStopHandlers: Map<string, () => unknown>;
    _extraHeaders: Map<string, Map<string, unknown>>;
    _requests: Map<number, TextUtils.ContentProvider.ContentProvider>;
    _requestIds: Map<TextUtils.ContentProvider.ContentProvider, number>;
    _lastRequestId: number;
    _registeredExtensions: Map<string, {
        name: string;
    }>;
    _status: ExtensionStatus;
    _sidebarPanes: ExtensionSidebarPane[];
    _traceProviders: ExtensionTraceProvider[];
    _traceSessions: Map<string, TracingSession>;
    _extensionsEnabled: boolean;
    _inspectedTabId?: string;
    _extensionAPITestHook?: (server: unknown, api: unknown) => unknown;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): ExtensionServer;
    initializeExtensions(): void;
    hasExtensions(): boolean;
    notifySearchAction(panelId: string, action: string, searchString?: string): void;
    notifyViewShown(identifier: string, frameIndex?: number): void;
    notifyViewHidden(identifier: string): void;
    notifyButtonClicked(identifier: string): void;
    _registerLanguageExtensionEndpoint(message: PrivateAPI.ExtensionServerRequestMessage, _shared_port: MessagePort): Record;
    _inspectedURLChanged(event: Common.EventTarget.EventTargetEvent<SDK.Target.Target>): void;
    startTraceRecording(providerId: string, sessionId: string, session: TracingSession): void;
    stopTraceRecording(providerId: string): void;
    hasSubscribers(type: string): boolean;
    _postNotification(type: string, ..._vararg: unknown[]): void;
    _onSubscribe(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    _onUnsubscribe(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    _onAddRequestHeaders(message: PrivateAPI.ExtensionServerRequestMessage): Record | undefined;
    _onApplyStyleSheet(message: PrivateAPI.ExtensionServerRequestMessage): Record | undefined;
    private getExtensionOrigin;
    _onCreatePanel(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record;
    _onShowPanel(message: PrivateAPI.ExtensionServerRequestMessage): Record | undefined;
    _onCreateToolbarButton(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record;
    _onUpdateButton(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record;
    _onCompleteTraceSession(message: PrivateAPI.ExtensionServerRequestMessage): Record | undefined;
    _onCreateSidebarPane(message: PrivateAPI.ExtensionServerRequestMessage): Record;
    sidebarPanes(): ExtensionSidebarPane[];
    _onSetSidebarHeight(message: PrivateAPI.ExtensionServerRequestMessage): Record;
    _onSetSidebarContent(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    _onSetSidebarPage(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    _onOpenResource(message: PrivateAPI.ExtensionServerRequestMessage): Record;
    _onSetOpenResourceHandler(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    _handleOpenURL(port: MessagePort, contentProvider: TextUtils.ContentProvider.ContentProvider, lineNumber: number): void;
    _onReload(message: PrivateAPI.ExtensionServerRequestMessage): Record;
    _onEvaluateOnInspectedPage(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    _onGetHAR(message: PrivateAPI.ExtensionServerRequestMessage): Promise<Record | HAR.Log.LogDTO>;
    _makeResource(contentProvider: TextUtils.ContentProvider.ContentProvider): {
        url: string;
        type: string;
    };
    _onGetPageResources(): {
        url: string;
        type: string;
    }[];
    _getResourceContent(contentProvider: TextUtils.ContentProvider.ContentProvider, message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Promise<void>;
    _onGetRequestContent(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    _onGetResourceContent(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    _onSetResourceContent(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    _requestId(request: TextUtils.ContentProvider.ContentProvider): number;
    _requestById(id: number): TextUtils.ContentProvider.ContentProvider | undefined;
    _onAddTraceProvider(message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort): Record | undefined;
    traceProviders(): ExtensionTraceProvider[];
    _onForwardKeyboardEvent(message: PrivateAPI.ExtensionServerRequestMessage): Record | undefined;
    _dispatchCallback(requestId: unknown, port: MessagePort, result: unknown): void;
    _initExtensions(): void;
    _notifyResourceAdded(event: Common.EventTarget.EventTargetEvent<Workspace.UISourceCode.UISourceCode>): void;
    _notifyUISourceCodeContentCommitted(event: Common.EventTarget.EventTargetEvent<{
        uiSourceCode: Workspace.UISourceCode.UISourceCode;
        content: string;
        encoded: boolean;
    }>): void;
    _notifyRequestFinished(event: Common.EventTarget.EventTargetEvent<SDK.NetworkRequest.NetworkRequest>): Promise<void>;
    _notifyElementsSelectionChanged(): void;
    sourceSelectionChanged(url: string, range: TextUtils.TextRange.TextRange): void;
    _setInspectedTabId(event: Common.EventTarget.EventTargetEvent): void;
    _addExtension(extensionInfo: Host.InspectorFrontendHostAPI.ExtensionDescriptor): boolean | undefined;
    _registerExtension(origin: string, port: MessagePort): void;
    _onWindowMessage(event: MessageEvent): void;
    _onmessage(event: MessageEvent): Promise<void>;
    _registerHandler(command: string, callback: (message: PrivateAPI.ExtensionServerRequestMessage, port: MessagePort) => unknown): void;
    _registerSubscriptionHandler(eventTopic: string, onSubscribeFirst: () => unknown, onUnsubscribeLast: () => unknown): void;
    _registerAutosubscriptionHandler(eventTopic: string, eventTarget: Common.EventTarget.EventTarget, frontendEventType: string, handler: (arg0: Common.EventTarget.EventTargetEvent) => unknown): void;
    _registerAutosubscriptionTargetManagerHandler(eventTopic: string, modelClass: new (arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel, frontendEventType: string, handler: (arg0: Common.EventTarget.EventTargetEvent) => unknown): void;
    _registerResourceContentCommittedHandler(handler: (arg0: Common.EventTarget.EventTargetEvent) => unknown): void;
    _expandResourcePath(extensionPath: string, resourcePath: string): string;
    _normalizePath(path: string): string;
    evaluate(expression: string, exposeCommandLineAPI: boolean, returnByValue: boolean, options: PrivateAPI.EvaluateOptions | undefined, securityOrigin: string, callback: (arg0: string | null, arg1: SDK.RemoteObject.RemoteObject | null, arg2: boolean) => unknown): Record | undefined;
    _canInspectURL(url: string): boolean;
    _disableExtensions(): void;
}
export declare enum Events {
    SidebarPaneAdded = "SidebarPaneAdded",
    TraceProviderAdded = "TraceProviderAdded"
}
export declare class ExtensionStatus {
    OK: (...args: unknown[]) => Record;
    E_EXISTS: (...args: unknown[]) => Record;
    E_BADARG: (...args: unknown[]) => Record;
    E_BADARGTYPE: (...args: unknown[]) => Record;
    E_NOTFOUND: (...args: unknown[]) => Record;
    E_NOTSUPPORTED: (...args: unknown[]) => Record;
    E_PROTOCOLERROR: (...args: unknown[]) => Record;
    E_FAILED: (...args: unknown[]) => Record;
    constructor();
}
export interface Record {
    code: string;
    description: string;
    details: unknown[];
    isError?: boolean;
}
