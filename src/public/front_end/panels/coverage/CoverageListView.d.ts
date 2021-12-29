import * as DataGrid from '../../ui/legacy/components/data_grid/data_grid.js';
import * as UI from '../../ui/legacy/legacy.js';
import type { URLCoverageInfo } from './CoverageModel.js';
import { CoverageType } from './CoverageModel.js';
export declare function coverageTypeToString(type: CoverageType): string;
export declare class CoverageListView extends UI.Widget.VBox {
    _nodeForCoverageInfo: Map<URLCoverageInfo, GridNode>;
    _isVisibleFilter: (arg0: URLCoverageInfo) => boolean;
    _highlightRegExp: RegExp | null;
    _dataGrid: DataGrid.SortableDataGrid.SortableDataGrid<GridNode>;
    constructor(isVisibleFilter: (arg0: URLCoverageInfo) => boolean);
    update(coverageInfo: URLCoverageInfo[]): void;
    reset(): void;
    updateFilterAndHighlight(highlightRegExp: RegExp | null): void;
    selectByUrl(url: string): void;
    _onOpenedNode(): void;
    _onKeyDown(event: KeyboardEvent): void;
    _revealSourceForSelectedNode(): Promise<void>;
    _sortingChanged(): void;
}
export declare class GridNode extends DataGrid.SortableDataGrid.SortableDataGridNode<GridNode> {
    _coverageInfo: URLCoverageInfo;
    _lastUsedSize: number | undefined;
    _url: string;
    _maxSize: number;
    _highlightRegExp: RegExp | null;
    constructor(coverageInfo: URLCoverageInfo, maxSize: number);
    _setHighlight(highlightRegExp: RegExp | null): void;
    _refreshIfNeeded(maxSize: number): boolean;
    createCell(columnId: string): HTMLElement;
    _highlight(element: Element, textContent: string): void;
    static sortFunctionForColumn(columnId: string): ((arg0: GridNode, arg1: GridNode) => number) | null;
}
