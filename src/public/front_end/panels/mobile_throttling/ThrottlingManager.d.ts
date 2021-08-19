import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import { NetworkThrottlingSelector } from './NetworkThrottlingSelector.js';
export declare class ThrottlingManager {
    _cpuThrottlingControls: Set<UI.Toolbar.ToolbarComboBox>;
    _cpuThrottlingRates: number[];
    _customNetworkConditionsSetting: Common.Settings.Setting<SDK.NetworkManager.Conditions[]>;
    _currentNetworkThrottlingConditionsSetting: Common.Settings.Setting<SDK.NetworkManager.Conditions>;
    _lastNetworkThrottlingConditions: SDK.NetworkManager.Conditions;
    _cpuThrottlingManager: SDK.CPUThrottlingManager.CPUThrottlingManager;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): ThrottlingManager;
    decorateSelectWithNetworkThrottling(selectElement: HTMLSelectElement): NetworkThrottlingSelector;
    createOfflineToolbarCheckbox(): UI.Toolbar.ToolbarCheckbox;
    createMobileThrottlingButton(): UI.Toolbar.ToolbarMenuButton;
    setCPUThrottlingRate(rate: number): void;
    createCPUThrottlingSelector(): UI.Toolbar.ToolbarComboBox;
    _isDirty(): boolean;
}
export declare class ActionDelegate implements UI.ActionRegistration.ActionDelegate {
    static instance(opts?: {
        forceNew: boolean | null;
    }): ActionDelegate;
    handleAction(context: UI.Context.Context, actionId: string): boolean;
}
export declare function throttlingManager(): ThrottlingManager;
