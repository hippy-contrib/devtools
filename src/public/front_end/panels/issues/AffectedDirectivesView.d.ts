import type * as Platform from '../../core/platform/platform.js';
import type * as Protocol from '../../generated/protocol.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as IssuesManager from '../../models/issues_manager/issues_manager.js';
import { AffectedResourcesView } from './AffectedResourcesView.js';
import type { AggregatedIssue } from './IssueAggregator.js';
import type { IssueView } from './IssueView.js';
export declare class AffectedDirectivesView extends AffectedResourcesView {
    _issue: AggregatedIssue;
    constructor(parent: IssueView, issue: AggregatedIssue);
    _appendStatus(element: Element, isReportOnly: boolean): void;
    protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString;
    _appendViolatedDirective(element: Element, directive: string): void;
    _appendBlockedURL(element: Element, url: string): void;
    _appendBlockedElement(element: Element, nodeId: Protocol.DOM.BackendNodeId | undefined, model: SDK.IssuesModel.IssuesModel): void;
    _appendAffectedContentSecurityPolicyDetails(cspIssues: Iterable<IssuesManager.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue>): void;
    _appendAffectedContentSecurityPolicyDetail(cspIssue: IssuesManager.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue): void;
    update(): void;
}
