import type * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as Workspace from '../../models/workspace/workspace.js';
import type { CoverageInfo, CoverageModel } from './CoverageModel.js';
export declare const decoratorType = "coverage";
export declare class CoverageDecorationManager {
    _coverageModel: CoverageModel;
    _textByProvider: Map<TextUtils.ContentProvider.ContentProvider, TextUtils.Text.Text | null>;
    _uiSourceCodeByContentProvider: Platform.MapUtilities.Multimap<TextUtils.ContentProvider.ContentProvider, Workspace.UISourceCode.UISourceCode>;
    constructor(coverageModel: CoverageModel);
    reset(): void;
    dispose(): void;
    update(updatedEntries: CoverageInfo[]): void;
    usageByLine(uiSourceCode: Workspace.UISourceCode.UISourceCode): Promise<(boolean | undefined)[]>;
    _updateTexts(uiSourceCode: Workspace.UISourceCode.UISourceCode, text: TextUtils.Text.Text): Promise<void>;
    _updateTextForProvider(contentProvider: TextUtils.ContentProvider.ContentProvider): Promise<void>;
    _rawLocationsForSourceLocation(uiSourceCode: Workspace.UISourceCode.UISourceCode, line: number, column: number): Promise<RawLocation[]>;
    static _compareLocations(a: RawLocation, b: RawLocation): number;
    _onUISourceCodeAdded(event: Common.EventTarget.EventTargetEvent): void;
}
export interface RawLocation {
    id: string;
    contentProvider: TextUtils.ContentProvider.ContentProvider;
    line: number;
    column: number;
}
