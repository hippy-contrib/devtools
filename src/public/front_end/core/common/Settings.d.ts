import type * as Platform from '../platform/platform.js';
import type { Color } from './Color.js';
import { Format } from './Color.js';
import type { EventDescriptor, EventTargetEvent } from './EventTarget.js';
import { ObjectWrapper } from './Object.js';
import { getLocalizedSettingsCategory, getRegisteredSettings, maybeRemoveSettingExtension, RegExpSettingItem, registerSettingExtension, registerSettingsForTest, resetSettings, SettingCategory, SettingExtensionOption, SettingRegistration, SettingType } from './SettingRegistration.js';
export declare class Settings {
    readonly globalStorage: SettingsStorage;
    private readonly localStorage;
    private readonly sessionStorage;
    settingNameSet: Set<string>;
    orderValuesBySettingCategory: Map<SettingCategory, Set<number>>;
    private eventSupport;
    private registry;
    readonly moduleSettings: Map<string, Setting<unknown>>;
    private constructor();
    static hasInstance(): boolean;
    static instance(opts?: {
        forceNew: boolean | null;
        globalStorage: SettingsStorage | null;
        localStorage: SettingsStorage | null;
    }): Settings;
    static removeInstance(): void;
    _registerModuleSetting(setting: Setting<unknown>): void;
    moduleSetting<T = any>(settingName: string): Setting<T>;
    settingForTest(settingName: string): Setting<unknown>;
    createSetting<T>(key: string, defaultValue: T, storageType?: SettingStorageType): Setting<T>;
    createLocalSetting<T>(key: string, defaultValue: T): Setting<T>;
    createRegExpSetting(key: string, defaultValue: string, regexFlags?: string, storageType?: SettingStorageType): RegExpSetting;
    clearAll(): void;
    _storageFromType(storageType?: SettingStorageType): SettingsStorage;
    getRegistry(): Map<string, Setting<unknown>>;
}
export declare class SettingsStorage {
    private object;
    private readonly setCallback;
    private readonly removeCallback;
    private readonly removeAllCallback;
    private storagePrefix;
    constructor(object: {
        [x: string]: string;
    }, setCallback?: ((arg0: string, arg1: string) => void), removeCallback?: ((arg0: string) => void), removeAllCallback?: ((arg0?: string | undefined) => void), storagePrefix?: string);
    set(name: string, value: string): void;
    has(name: string): boolean;
    get(name: string): string;
    remove(name: string): void;
    removeAll(): void;
    _dumpSizes(): void;
}
export declare class Setting<V> {
    private nameInternal;
    private defaultValueInternal;
    private readonly eventSupport;
    private storage;
    private titleFunction;
    private titleInternal;
    private registration;
    private requiresUserAction?;
    private value?;
    private serializer;
    private hadUserAction?;
    constructor(name: string, defaultValue: V, eventSupport: ObjectWrapper, storage: SettingsStorage);
    setSerializer(serializer: Serializer<unknown, V>): void;
    addChangeListener(listener: (arg0: EventTargetEvent) => void, thisObject?: Object): EventDescriptor;
    removeChangeListener(listener: (arg0: EventTargetEvent) => void, thisObject?: Object): void;
    get name(): string;
    title(): string;
    setTitleFunction(titleFunction: (() => Platform.UIString.LocalizedString) | undefined): void;
    setTitle(title: string): void;
    setRequiresUserAction(requiresUserAction: boolean): void;
    get(): V;
    set(value: V): void;
    setRegistration(registration: SettingRegistration): void;
    type(): SettingType | null;
    options(): SimpleSettingOption[];
    reloadRequired(): boolean | null;
    category(): SettingCategory | null;
    tags(): string | null;
    order(): number | null;
    _printSettingsSavingError(message: string, name: string, value: string): void;
    defaultValue(): V;
    getStorage(): SettingsStorage;
}
export declare class RegExpSetting extends Setting<any> {
    private regexFlags;
    private regex?;
    constructor(name: string, defaultValue: string, eventSupport: ObjectWrapper, storage: SettingsStorage, regexFlags?: string);
    get(): string;
    getAsArray(): RegExpSettingItem[];
    set(value: string): void;
    setAsArray(value: RegExpSettingItem[]): void;
    asRegExp(): RegExp | null;
}
export declare class VersionController {
    static get currentVersionName(): string;
    static get currentVersion(): number;
    updateVersion(): void;
    _methodsToRunToUpdateVersion(oldVersion: number, currentVersion: number): string[];
    _updateVersionFrom0To1(): void;
    _updateVersionFrom1To2(): void;
    _updateVersionFrom2To3(): void;
    _updateVersionFrom3To4(): void;
    _updateVersionFrom4To5(): void;
    _updateVersionFrom5To6(): void;
    _updateVersionFrom6To7(): void;
    _updateVersionFrom7To8(): void;
    _updateVersionFrom8To9(): void;
    _updateVersionFrom9To10(): void;
    _updateVersionFrom10To11(): void;
    _updateVersionFrom11To12(): void;
    _updateVersionFrom12To13(): void;
    _updateVersionFrom13To14(): void;
    _updateVersionFrom14To15(): void;
    _updateVersionFrom15To16(): void;
    _updateVersionFrom16To17(): void;
    _updateVersionFrom17To18(): void;
    _updateVersionFrom18To19(): void;
    _updateVersionFrom19To20(): void;
    _updateVersionFrom20To21(): void;
    _updateVersionFrom21To22(): void;
    _updateVersionFrom22To23(): void;
    _updateVersionFrom23To24(): void;
    _updateVersionFrom24To25(): void;
    _updateVersionFrom25To26(): void;
    _updateVersionFrom26To27(): void;
    _updateVersionFrom27To28(): void;
    _updateVersionFrom28To29(): void;
    _updateVersionFrom29To30(): void;
    _migrateSettingsFromLocalStorage(): void;
    _clearBreakpointsWhenTooMany(breakpointsSetting: Setting<unknown[]>, maxBreakpointsCount: number): void;
}
export declare enum SettingStorageType {
    Global = "Global",
    Local = "Local",
    Session = "Session"
}
export declare function moduleSetting(settingName: string): Setting<unknown>;
export declare function settingForTest(settingName: string): Setting<unknown>;
export declare function detectColorFormat(color: Color): Format;
export { getLocalizedSettingsCategory, getRegisteredSettings, maybeRemoveSettingExtension, registerSettingExtension, RegExpSettingItem, SettingCategory, SettingExtensionOption, SettingRegistration, SettingType, registerSettingsForTest, resetSettings, };
export interface Serializer<I, O> {
    stringify: (value: I) => string;
    parse: (value: string) => O;
}
export interface SimpleSettingOption {
    value: string | boolean;
    title: string;
    text?: string;
    raw?: boolean;
}
