import * as Common from '../../core/common/common.js';
import * as UI from '../../ui/legacy/legacy.js';
export declare class LocationsSettingsTab extends UI.Widget.VBox implements UI.ListWidget.Delegate<LocationDescription> {
    _list: UI.ListWidget.ListWidget<LocationDescription>;
    _customSetting: Common.Settings.Setting<LocationDescription[]>;
    _editor?: UI.ListWidget.Editor<LocationDescription>;
    private constructor();
    static instance(): LocationsSettingsTab;
    wasShown(): void;
    _locationsUpdated(): void;
    _addButtonClicked(): void;
    renderItem(location: LocationDescription, _editable: boolean): Element;
    removeItemRequested(item: LocationDescription, index: number): void;
    commitEdit(location: LocationDescription, editor: UI.ListWidget.Editor<LocationDescription>, isNew: boolean): void;
    beginEdit(location: LocationDescription): UI.ListWidget.Editor<LocationDescription>;
    _createEditor(): UI.ListWidget.Editor<LocationDescription>;
}
export interface LocationDescription {
    title: string;
    lat: number;
    long: number;
    timezoneId: string;
    locale: string;
}
