import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import * as Workspace from '../workspace/workspace.js';
import type { Chrome } from '../../../extension-api/ExtensionAPI.js';
import { ContentProviderBasedProject } from './ContentProviderBasedProject.js';
import type { DebuggerWorkspaceBinding } from './DebuggerWorkspaceBinding.js';
export declare class ValueNode extends SDK.RemoteObject.RemoteObjectImpl {
    inspectableAddress?: number;
    callFrame: SDK.DebuggerModel.CallFrame;
    constructor(callFrame: SDK.DebuggerModel.CallFrame, objectId: string | undefined, type: string, subtype: string | undefined, value: any, inspectableAddress?: number, unserializableValue?: string, description?: string, preview?: Protocol.Runtime.ObjectPreview, customPreview?: Protocol.Runtime.CustomPreview, className?: string);
}
declare class SourceScopeRemoteObject extends SDK.RemoteObject.RemoteObjectImpl {
    variables: Chrome.DevTools.Variable[];
    _callFrame: SDK.DebuggerModel.CallFrame;
    _plugin: DebuggerLanguagePlugin;
    _location: Chrome.DevTools.RawLocation;
    constructor(callFrame: SDK.DebuggerModel.CallFrame, plugin: DebuggerLanguagePlugin, location: Chrome.DevTools.RawLocation);
    doGetProperties(ownProperties: boolean, accessorPropertiesOnly: boolean, _generatePreview: boolean): Promise<SDK.RemoteObject.GetPropertiesResult>;
}
export declare class SourceScope implements SDK.DebuggerModel.ScopeChainEntry {
    _callFrame: SDK.DebuggerModel.CallFrame;
    _type: string;
    _typeName: string;
    _icon: string | undefined;
    _object: SourceScopeRemoteObject;
    _name: string;
    _startLocation: SDK.DebuggerModel.Location | null;
    _endLocation: SDK.DebuggerModel.Location | null;
    constructor(callFrame: SDK.DebuggerModel.CallFrame, type: string, typeName: string, icon: string | undefined, plugin: DebuggerLanguagePlugin, location: Chrome.DevTools.RawLocation);
    getVariableValue(name: string): Promise<SDK.RemoteObject.RemoteObject | null>;
    callFrame(): SDK.DebuggerModel.CallFrame;
    type(): string;
    typeName(): string;
    name(): string | undefined;
    startLocation(): SDK.DebuggerModel.Location | null;
    endLocation(): SDK.DebuggerModel.Location | null;
    object(): SourceScopeRemoteObject;
    description(): string;
    icon(): string | undefined;
}
export declare class DebuggerLanguagePluginManager implements SDK.TargetManager.SDKModelObserver<SDK.DebuggerModel.DebuggerModel> {
    _workspace: Workspace.Workspace.WorkspaceImpl;
    _debuggerWorkspaceBinding: DebuggerWorkspaceBinding;
    _plugins: DebuggerLanguagePlugin[];
    _debuggerModelToData: Map<SDK.DebuggerModel.DebuggerModel, ModelData>;
    _rawModuleHandles: Map<string, {
        rawModuleId: string;
        plugin: DebuggerLanguagePlugin;
        scripts: Array<SDK.Script.Script>;
        addRawModulePromise: Promise<Array<string>>;
    }>;
    constructor(targetManager: SDK.TargetManager.TargetManager, workspace: Workspace.Workspace.WorkspaceImpl, debuggerWorkspaceBinding: DebuggerWorkspaceBinding);
    _evaluateOnCallFrame(callFrame: SDK.DebuggerModel.CallFrame, options: SDK.RuntimeModel.EvaluationOptions): Promise<{
        object: SDK.RemoteObject.RemoteObject;
        exceptionDetails: Protocol.Runtime.ExceptionDetails | undefined;
    } | {
        error: string;
    } | null>;
    _expandCallFrames(callFrames: SDK.DebuggerModel.CallFrame[]): Promise<SDK.DebuggerModel.CallFrame[]>;
    modelAdded(debuggerModel: SDK.DebuggerModel.DebuggerModel): void;
    modelRemoved(debuggerModel: SDK.DebuggerModel.DebuggerModel): void;
    _globalObjectCleared(event: Common.EventTarget.EventTargetEvent): void;
    addPlugin(plugin: DebuggerLanguagePlugin): void;
    removePlugin(plugin: DebuggerLanguagePlugin): void;
    hasPluginForScript(script: SDK.Script.Script): boolean;
    /**
     * Returns the responsible language plugin and the raw module ID for a script.
     *
     * This ensures that the `addRawModule` call finishes first such that the
     * caller can immediately issue calls to the returned plugin without the
     * risk of racing with the `addRawModule` call. The returned plugin will be
     * set to undefined to indicate that there's no plugin for the script.
     */
    _rawModuleIdAndPluginForScript(script: SDK.Script.Script): Promise<{
        rawModuleId: string;
        plugin: DebuggerLanguagePlugin | null;
    }>;
    uiSourceCodeForURL(debuggerModel: SDK.DebuggerModel.DebuggerModel, url: string): Workspace.UISourceCode.UISourceCode | null;
    rawLocationToUILocation(rawLocation: SDK.DebuggerModel.Location): Promise<Workspace.UISourceCode.UILocation | null>;
    uiLocationToRawLocationRanges(uiSourceCode: Workspace.UISourceCode.UISourceCode, lineNumber: number, columnNumber?: number | undefined): Promise<{
        start: SDK.DebuggerModel.Location;
        end: SDK.DebuggerModel.Location;
    }[] | null>;
    uiLocationToRawLocations(uiSourceCode: Workspace.UISourceCode.UISourceCode, lineNumber: number, columnNumber?: number): Promise<SDK.DebuggerModel.Location[] | null>;
    scriptsForUISourceCode(uiSourceCode: Workspace.UISourceCode.UISourceCode): SDK.Script.Script[];
    _parsedScriptSource(event: Common.EventTarget.EventTargetEvent): void;
    resolveScopeChain(callFrame: SDK.DebuggerModel.CallFrame): Promise<SourceScope[] | null>;
    getFunctionInfo(script: SDK.Script.Script, location: SDK.DebuggerModel.Location): Promise<{
        frames: Array<Chrome.DevTools.FunctionInfo>;
        missingSymbolFiles?: Array<string>;
    } | null>;
    getInlinedFunctionRanges(rawLocation: SDK.DebuggerModel.Location): Promise<{
        start: SDK.DebuggerModel.Location;
        end: SDK.DebuggerModel.Location;
    }[]>;
    getInlinedCalleesRanges(rawLocation: SDK.DebuggerModel.Location): Promise<{
        start: SDK.DebuggerModel.Location;
        end: SDK.DebuggerModel.Location;
    }[]>;
    getMappedLines(uiSourceCode: Workspace.UISourceCode.UISourceCode): Promise<Set<number> | undefined>;
}
declare class ModelData {
    _debuggerModel: SDK.DebuggerModel.DebuggerModel;
    _project: ContentProviderBasedProject;
    _uiSourceCodeToScripts: Map<Workspace.UISourceCode.UISourceCode, SDK.Script.Script[]>;
    constructor(debuggerModel: SDK.DebuggerModel.DebuggerModel, workspace: Workspace.Workspace.WorkspaceImpl);
    _addSourceFiles(script: SDK.Script.Script, urls: string[]): void;
    _removeScript(script: SDK.Script.Script): void;
    _dispose(): void;
}
export declare class DebuggerLanguagePlugin {
    name: string;
    constructor(name: string);
    handleScript(_script: SDK.Script.Script): boolean;
    dispose(): void;
    /** Notify the plugin about a new script
      */
    addRawModule(_rawModuleId: string, _symbolsURL: string, _rawModule: Chrome.DevTools.RawModule): Promise<string[]>;
    /** Find locations in raw modules from a location in a source file
      */
    sourceLocationToRawLocation(_sourceLocation: Chrome.DevTools.SourceLocation): Promise<Chrome.DevTools.RawLocationRange[]>;
    /** Find locations in source files from a location in a raw module
      */
    rawLocationToSourceLocation(_rawLocation: Chrome.DevTools.RawLocation): Promise<Chrome.DevTools.SourceLocation[]>;
    /** Return detailed information about a scope
       */
    getScopeInfo(_type: string): Promise<Chrome.DevTools.ScopeInfo>;
    /** List all variables in lexical scope at a given location in a raw module
      */
    listVariablesInScope(_rawLocation: Chrome.DevTools.RawLocation): Promise<Chrome.DevTools.Variable[]>;
    /**
     * Notifies the plugin that a script is removed.
     */
    removeRawModule(_rawModuleId: string): Promise<void>;
    getTypeInfo(_expression: string, _context: Chrome.DevTools.RawLocation): Promise<{
        typeInfos: Array<Chrome.DevTools.TypeInfo>;
        base: Chrome.DevTools.EvalBase;
    } | null>;
    getFormatter(_expressionOrField: string | {
        base: Chrome.DevTools.EvalBase;
        field: Array<Chrome.DevTools.FieldInfo>;
    }, _context: Chrome.DevTools.RawLocation): Promise<{
        js: string;
    } | null>;
    getInspectableAddress(_field: {
        base: Chrome.DevTools.EvalBase;
        field: Array<Chrome.DevTools.FieldInfo>;
    }): Promise<{
        js: string;
    }>;
    /**
     * Find locations in source files from a location in a raw module
     */
    getFunctionInfo(_rawLocation: Chrome.DevTools.RawLocation): Promise<{
        frames: Array<Chrome.DevTools.FunctionInfo>;
        missingSymbolFiles?: Array<string>;
    }>;
    /**
     * Find locations in raw modules corresponding to the inline function
     * that rawLocation is in. Used for stepping out of an inline function.
     */
    getInlinedFunctionRanges(_rawLocation: Chrome.DevTools.RawLocation): Promise<Chrome.DevTools.RawLocationRange[]>;
    /**
     * Find locations in raw modules corresponding to inline functions
     * called by the function or inline frame that rawLocation is in.
     * Used for stepping over inline functions.
     */
    getInlinedCalleesRanges(_rawLocation: Chrome.DevTools.RawLocation): Promise<Chrome.DevTools.RawLocationRange[]>;
    getMappedLines(_rawModuleId: string, _sourceFileURL: string): Promise<number[] | undefined>;
}
export {};
