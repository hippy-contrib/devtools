import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
export declare class NetworkLog extends Common.ObjectWrapper.ObjectWrapper implements SDK.TargetManager.SDKModelObserver<SDK.NetworkManager.NetworkManager> {
    _requests: SDK.NetworkRequest.NetworkRequest[];
    _sentNetworkRequests: Protocol.Network.Request[];
    _receivedNetworkResponses: Protocol.Network.Response[];
    _requestsSet: Set<SDK.NetworkRequest.NetworkRequest>;
    _requestsMap: Map<string, SDK.NetworkRequest.NetworkRequest[]>;
    _pageLoadForManager: Map<SDK.NetworkManager.NetworkManager, SDK.PageLoad.PageLoad>;
    _isRecording: boolean;
    _modelListeners: WeakMap<SDK.NetworkManager.NetworkManager, Common.EventTarget.EventDescriptor[]>;
    _initiatorData: WeakMap<SDK.NetworkRequest.NetworkRequest, InitiatorData>;
    _unresolvedPreflightRequests: Map<string, SDK.NetworkRequest.NetworkRequest>;
    constructor();
    static instance(): NetworkLog;
    modelAdded(networkManager: SDK.NetworkManager.NetworkManager): void;
    modelRemoved(networkManager: SDK.NetworkManager.NetworkManager): void;
    _removeNetworkManagerListeners(networkManager: SDK.NetworkManager.NetworkManager): void;
    setIsRecording(enabled: boolean): void;
    requestForURL(url: string): SDK.NetworkRequest.NetworkRequest | null;
    originalRequestForURL(url: string): Protocol.Network.Request | null;
    originalResponseForURL(url: string): Protocol.Network.Response | null;
    requests(): SDK.NetworkRequest.NetworkRequest[];
    requestByManagerAndId(networkManager: SDK.NetworkManager.NetworkManager, requestId: string): SDK.NetworkRequest.NetworkRequest | null;
    _requestByManagerAndURL(networkManager: SDK.NetworkManager.NetworkManager, url: string): SDK.NetworkRequest.NetworkRequest | null;
    _initializeInitiatorSymbolIfNeeded(request: SDK.NetworkRequest.NetworkRequest): InitiatorData;
    initiatorInfoForRequest(request: SDK.NetworkRequest.NetworkRequest): InitiatorInfo;
    initiatorGraphForRequest(request: SDK.NetworkRequest.NetworkRequest): InitiatorGraph;
    _initiatorChain(request: SDK.NetworkRequest.NetworkRequest): Set<SDK.NetworkRequest.NetworkRequest>;
    _initiatorRequest(request: SDK.NetworkRequest.NetworkRequest): SDK.NetworkRequest.NetworkRequest | null;
    _willReloadPage(): void;
    _onMainFrameNavigated(event: Common.EventTarget.EventTargetEvent<SDK.ResourceTreeModel.ResourceTreeFrame>): void;
    _addRequest(request: SDK.NetworkRequest.NetworkRequest): void;
    _tryResolvePreflightRequests(request: SDK.NetworkRequest.NetworkRequest): void;
    importRequests(requests: SDK.NetworkRequest.NetworkRequest[]): void;
    _onRequestStarted(event: Common.EventTarget.EventTargetEvent<SDK.NetworkManager.RequestStartedEvent>): void;
    _onResponseReceived(event: Common.EventTarget.EventTargetEvent<SDK.NetworkManager.ResponseReceivedEvent>): void;
    _onRequestUpdated(event: Common.EventTarget.EventTargetEvent<SDK.NetworkRequest.NetworkRequest>): void;
    _onRequestRedirect(event: Common.EventTarget.EventTargetEvent<SDK.NetworkRequest.NetworkRequest>): void;
    _onDOMContentLoaded(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel, event: Common.EventTarget.EventTargetEvent<number>): void;
    _onLoad(event: Common.EventTarget.EventTargetEvent<{
        resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel;
        loadTime: number;
    }>): void;
    reset(clearIfPreserved: boolean): void;
    _networkMessageGenerated(networkManager: SDK.NetworkManager.NetworkManager, event: Common.EventTarget.EventTargetEvent<SDK.NetworkManager.MessageGeneratedEvent>): void;
    associateConsoleMessageWithRequest(consoleMessage: SDK.ConsoleModel.ConsoleMessage, requestId: string): void;
    static requestForConsoleMessage(consoleMessage: SDK.ConsoleModel.ConsoleMessage): SDK.NetworkRequest.NetworkRequest | null;
    requestsForId(requestId: string): SDK.NetworkRequest.NetworkRequest[];
}
export declare const Events: {
    Reset: symbol;
    RequestAdded: symbol;
    RequestUpdated: symbol;
};
interface InitiatorData {
    info: InitiatorInfo | null;
    chain: Set<SDK.NetworkRequest.NetworkRequest> | null;
    request?: SDK.NetworkRequest.NetworkRequest | null;
}
export interface InitiatorGraph {
    initiators: Set<SDK.NetworkRequest.NetworkRequest>;
    initiated: Map<SDK.NetworkRequest.NetworkRequest, SDK.NetworkRequest.NetworkRequest>;
}
interface InitiatorInfo {
    type: SDK.NetworkRequest.InitiatorType;
    url: string;
    lineNumber: number;
    columnNumber: number;
    scriptId: string | null;
    stack: Protocol.Runtime.StackTrace | null;
    initiatorRequest: SDK.NetworkRequest.NetworkRequest | null;
}
export {};
