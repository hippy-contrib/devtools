import * as Common from '../../core/common/common.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as IssueCounter from '../../ui/components/issue_counter/issue_counter.js';
import * as UI from '../../ui/legacy/legacy.js';
export declare class WarningErrorCounter implements UI.Toolbar.Provider {
    _toolbarItem: UI.Toolbar.ToolbarItemWithCompactLayout;
    _consoleCounter: IconButton.IconButton.IconButton;
    _issueCounter: IssueCounter.IssueCounter.IssueCounter;
    _throttler: Common.Throttler.Throttler;
    _updatingForTest?: boolean;
    private constructor();
    onSetCompactLayout(event: Common.EventTarget.EventTargetEvent<boolean>): void;
    setCompactLayout(enable: boolean): void;
    static instance(opts?: {
        forceNew: boolean | null;
    }): WarningErrorCounter;
    _updatedForTest(): void;
    _update(): void;
    get titlesForTesting(): string | null;
    _updateThrottled(): Promise<void>;
    item(): UI.Toolbar.ToolbarItem | null;
    static _instanceForTest: WarningErrorCounter | null;
}
