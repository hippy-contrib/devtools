import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as Workspace from '../../models/workspace/workspace.js';
import { CoverageDecorationManager } from './CoverageDecorationManager.js';
import { CoverageListView } from './CoverageListView.js';
import type { CoverageInfo, URLCoverageInfo } from './CoverageModel.js';
import { CoverageModel } from './CoverageModel.js';
export declare class CoverageView extends UI.Widget.VBox {
    _model: CoverageModel | null;
    _decorationManager: CoverageDecorationManager | null;
    _resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel | null;
    _coverageTypeComboBox: UI.Toolbar.ToolbarComboBox;
    _coverageTypeComboBoxSetting: Common.Settings.Setting<number>;
    _toggleRecordAction: UI.ActionRegistration.Action;
    _toggleRecordButton: UI.Toolbar.ToolbarButton;
    _inlineReloadButton: Element | null;
    _startWithReloadButton: UI.Toolbar.ToolbarButton | undefined;
    _clearButton: UI.Toolbar.ToolbarButton;
    _saveButton: UI.Toolbar.ToolbarButton;
    _textFilterRegExp: RegExp | null;
    _filterInput: UI.Toolbar.ToolbarInput;
    _typeFilterValue: number | null;
    _filterByTypeComboBox: UI.Toolbar.ToolbarComboBox;
    _showContentScriptsSetting: Common.Settings.Setting<boolean>;
    _contentScriptsCheckbox: UI.Toolbar.ToolbarSettingCheckbox;
    _coverageResultsElement: HTMLElement;
    _landingPage: UI.Widget.VBox;
    _listView: CoverageListView;
    _statusToolbarElement: HTMLElement;
    _statusMessageElement: HTMLElement;
    private constructor();
    static instance(): CoverageView;
    _buildLandingPage(): UI.Widget.VBox;
    _clear(): void;
    _reset(): void;
    _toggleRecording(): void;
    isBlockCoverageSelected(): boolean;
    _selectCoverageType(jsCoveragePerBlock: boolean): void;
    _onCoverageTypeComboBoxSelectionChanged(): void;
    ensureRecordingStarted(): Promise<void>;
    _startRecording(options: {
        reload: (boolean | undefined);
        jsCoveragePerBlock: (boolean | undefined);
    } | null): Promise<void>;
    _onCoverageDataReceived(event: Common.EventTarget.EventTargetEvent): void;
    stopRecording(): Promise<void>;
    processBacklog(): void;
    _onMainFrameNavigated(): void;
    _updateViews(updatedEntries: CoverageInfo[]): void;
    _updateStats(): void;
    _onFilterChanged(): void;
    _onFilterByTypeChanged(): void;
    _isVisible(ignoreTextFilter: boolean, coverageInfo: URLCoverageInfo): boolean;
    _exportReport(): Promise<void>;
    selectCoverageItemByUrl(url: string): void;
    static readonly EXTENSION_BINDINGS_URL_PREFIX = "extensions::";
}
export declare class ActionDelegate implements UI.ActionRegistration.ActionDelegate {
    handleAction(context: UI.Context.Context, actionId: string): boolean;
    static instance(opts?: {
        forceNew: boolean | null;
    }): ActionDelegate;
    _innerHandleAction(coverageView: CoverageView, actionId: string): void;
}
export declare class LineDecorator implements SourceFrame.SourceFrame.LineDecorator {
    static instance({ forceNew }?: {
        forceNew: boolean;
    }): LineDecorator;
    _listeners: WeakMap<SourceFrame.SourcesTextEditor.SourcesTextEditor, (arg0: Common.EventTarget.EventTargetEvent) => void>;
    constructor();
    decorate(uiSourceCode: Workspace.UISourceCode.UISourceCode, textEditor: SourceFrame.SourcesTextEditor.SourcesTextEditor): void;
    _innerDecorate(uiSourceCode: Workspace.UISourceCode.UISourceCode, textEditor: SourceFrame.SourcesTextEditor.SourcesTextEditor, lineUsage: (boolean | undefined)[]): void;
    makeGutterClickHandler(url: string): (arg0: Common.EventTarget.EventTargetEvent) => void;
    _installGutter(textEditor: SourceFrame.SourcesTextEditor.SourcesTextEditor, url: string): void;
    _uninstallGutter(textEditor: SourceFrame.SourcesTextEditor.SourcesTextEditor): void;
    static readonly GUTTER_TYPE = "CodeMirror-gutter-coverage";
}
