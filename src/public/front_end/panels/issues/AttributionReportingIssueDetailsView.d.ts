import { AffectedResourcesView } from './AffectedResourcesView.js';
import type { AggregatedIssue } from './IssueAggregator.js';
import type { IssueView } from './IssueView.js';
export declare class AttributionReportingIssueDetailsView extends AffectedResourcesView {
    private issue;
    constructor(parentView: IssueView, issue: AggregatedIssue);
    protected getResourceNameWithCount(count: number): string;
    update(): void;
    private appendDetails;
    private appendDetail;
    private appendFrameOrEmptyCell;
    private appendElementOrEmptyCell;
    private appendRequestOrEmptyCell;
}
