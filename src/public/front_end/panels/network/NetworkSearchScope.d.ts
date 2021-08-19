import type * as Common from '../../core/common/common.js';
import type * as SDK from '../../core/sdk/sdk.js';
import type * as Search from '../search/search.js';
import * as NetworkForward from '../../panels/network/forward/forward.js';
export declare class NetworkSearchScope implements Search.SearchConfig.SearchScope {
    performIndexing(progress: Common.Progress.Progress): void;
    performSearch(searchConfig: Search.SearchConfig.SearchConfig, progress: Common.Progress.Progress, searchResultCallback: (arg0: Search.SearchConfig.SearchResult) => void, searchFinishedCallback: (arg0: boolean) => void): Promise<void>;
    _searchRequest(searchConfig: Search.SearchConfig.SearchConfig, request: SDK.NetworkRequest.NetworkRequest, progress: Common.Progress.Progress): Promise<NetworkSearchResult | null>;
    stopSearch(): void;
}
export declare class NetworkSearchResult implements Search.SearchConfig.SearchResult {
    _request: SDK.NetworkRequest.NetworkRequest;
    _locations: NetworkForward.UIRequestLocation.UIRequestLocation[];
    constructor(request: SDK.NetworkRequest.NetworkRequest, locations: NetworkForward.UIRequestLocation.UIRequestLocation[]);
    matchesCount(): number;
    label(): string;
    description(): string;
    matchLineContent(index: number): string;
    matchRevealable(index: number): Object;
    matchLabel(index: number): string;
}
