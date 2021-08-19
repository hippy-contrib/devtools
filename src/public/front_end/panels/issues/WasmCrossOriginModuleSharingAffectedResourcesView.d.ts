import type * as Platform from '../../core/platform/platform.js';
import { AffectedResourcesView } from './AffectedResourcesView.js';
import type { AggregatedIssue } from './IssueAggregator.js';
import type { IssueView } from './IssueView.js';
export declare class WasmCrossOriginModuleSharingAffectedResourcesView extends AffectedResourcesView {
    private issue;
    constructor(parent: IssueView, issue: AggregatedIssue);
    private appendIssues;
    protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString;
    private appendDetails;
    update(): void;
}
