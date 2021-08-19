import * as EmulationModel from '../../models/emulation/emulation.js';
import * as UI from '../../ui/legacy/legacy.js';
export declare class DevicesSettingsTab extends UI.Widget.VBox implements UI.ListWidget.Delegate<EmulationModel.EmulatedDevices.EmulatedDevice> {
    containerElement: HTMLElement;
    _addCustomButton: HTMLButtonElement;
    _list: UI.ListWidget.ListWidget<EmulationModel.EmulatedDevices.EmulatedDevice>;
    _muteUpdate: boolean;
    _emulatedDevicesList: EmulationModel.EmulatedDevices.EmulatedDevicesList;
    _editor?: UI.ListWidget.Editor<EmulationModel.EmulatedDevices.EmulatedDevice>;
    private constructor();
    static instance(): DevicesSettingsTab;
    wasShown(): void;
    _devicesUpdated(): void;
    _muteAndSaveDeviceList(custom: boolean): void;
    _addCustomDevice(): void;
    _toNumericInputValue(value: number): string;
    renderItem(device: EmulationModel.EmulatedDevices.EmulatedDevice, editable: boolean): Element;
    removeItemRequested(item: EmulationModel.EmulatedDevices.EmulatedDevice): void;
    commitEdit(device: EmulationModel.EmulatedDevices.EmulatedDevice, editor: UI.ListWidget.Editor<EmulationModel.EmulatedDevices.EmulatedDevice>, isNew: boolean): void;
    beginEdit(device: EmulationModel.EmulatedDevices.EmulatedDevice): UI.ListWidget.Editor<EmulationModel.EmulatedDevices.EmulatedDevice>;
    _createEditor(): UI.ListWidget.Editor<EmulationModel.EmulatedDevices.EmulatedDevice>;
}
