import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as NetworkForward from '../../panels/network/forward/forward.js';
import * as UI from '../../ui/legacy/legacy.js';
import type { NetworkTimeCalculator } from './NetworkTimeCalculator.js';
import { RequestCookiesView } from './RequestCookiesView.js';
import { RequestHeadersView } from './RequestHeadersView.js';
import { RequestResponseView } from './RequestResponseView.js';
export declare class NetworkItemView extends UI.TabbedPane.TabbedPane {
    _request: SDK.NetworkRequest.NetworkRequest;
    _resourceViewTabSetting: Common.Settings.Setting<NetworkForward.UIRequestLocation.UIRequestTabs>;
    _headersView: RequestHeadersView;
    _responseView: RequestResponseView | undefined;
    _cookiesView: RequestCookiesView | null;
    _initialTab?: NetworkForward.UIRequestLocation.UIRequestTabs;
    constructor(request: SDK.NetworkRequest.NetworkRequest, calculator: NetworkTimeCalculator, initialTab?: NetworkForward.UIRequestLocation.UIRequestTabs);
    wasShown(): void;
    willHide(): void;
    _maybeAppendCookiesPanel(): void;
    _maybeShowErrorIconInTrustTokenTabHeader(): void;
    _selectTab(tabId: string): void;
    _tabSelected(event: {
        data: any;
    }): void;
    request(): SDK.NetworkRequest.NetworkRequest;
    revealResponseBody(line?: number): Promise<void>;
    revealHeader(section: NetworkForward.UIRequestLocation.UIHeaderSection, header: string | undefined): void;
}
