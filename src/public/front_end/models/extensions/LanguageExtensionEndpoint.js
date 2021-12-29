// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Bindings from '../bindings/bindings.js';
export class LanguageExtensionEndpoint extends Bindings.DebuggerLanguagePlugins.DebuggerLanguagePlugin {
    _supportedScriptTypes;
    _port;
    _nextRequestId;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _pendingRequests;
    constructor(name, supportedScriptTypes, port) {
        super(name);
        this._supportedScriptTypes = supportedScriptTypes;
        this._port = port;
        this._port.onmessage = this._onResponse.bind(this);
        this._nextRequestId = 0;
        this._pendingRequests = new Map();
    }
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _sendRequest(method, parameters) {
        return new Promise((resolve, reject) => {
            const requestId = this._nextRequestId++;
            this._pendingRequests.set(requestId, { resolve, reject });
            this._port.postMessage({ requestId, method, parameters });
        });
    }
    _onResponse({ data }) {
        if ('event' in data) {
            const { event } = data;
            switch (event) {
                case "unregisteredLanguageExtensionPlugin" /* UnregisteredLanguageExtensionPlugin */: {
                    for (const { reject } of this._pendingRequests.values()) {
                        reject(new Error('Language extension endpoint disconnected'));
                    }
                    this._pendingRequests.clear();
                    this._port.close();
                    const { pluginManager } = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
                    if (pluginManager) {
                        pluginManager.removePlugin(this);
                    }
                    break;
                }
            }
            return;
        }
        const { requestId, result, error } = data;
        if (!this._pendingRequests.has(requestId)) {
            console.error(`No pending request ${requestId}`);
            return;
        }
        const { resolve, reject } = this._pendingRequests.get(requestId);
        this._pendingRequests.delete(requestId);
        if (error) {
            reject(new Error(error.message));
        }
        else {
            resolve(result);
        }
    }
    handleScript(script) {
        const language = script.scriptLanguage();
        return language !== null && script.debugSymbols !== null && language === this._supportedScriptTypes.language &&
            this._supportedScriptTypes.symbol_types.includes(script.debugSymbols.type);
    }
    /** Notify the plugin about a new script
       */
    addRawModule(rawModuleId, symbolsURL, rawModule) {
        return this._sendRequest("addRawModule" /* AddRawModule */, { rawModuleId, symbolsURL, rawModule });
    }
    /**
     * Notifies the plugin that a script is removed.
     */
    removeRawModule(rawModuleId) {
        return this._sendRequest("removeRawModule" /* RemoveRawModule */, { rawModuleId });
    }
    /** Find locations in raw modules from a location in a source file
       */
    sourceLocationToRawLocation(sourceLocation) {
        return this._sendRequest("sourceLocationToRawLocation" /* SourceLocationToRawLocation */, { sourceLocation });
    }
    /** Find locations in source files from a location in a raw module
       */
    rawLocationToSourceLocation(rawLocation) {
        return this._sendRequest("rawLocationToSourceLocation" /* RawLocationToSourceLocation */, { rawLocation });
    }
    getScopeInfo(type) {
        return this._sendRequest("getScopeInfo" /* GetScopeInfo */, { type });
    }
    /** List all variables in lexical scope at a given location in a raw module
       */
    listVariablesInScope(rawLocation) {
        return this._sendRequest("listVariablesInScope" /* ListVariablesInScope */, { rawLocation });
    }
    /** List all function names (including inlined frames) at location
       */
    getFunctionInfo(rawLocation) {
        return this._sendRequest("getFunctionInfo" /* GetFunctionInfo */, { rawLocation });
    }
    /** Find locations in raw modules corresponding to the inline function
       *  that rawLocation is in.
       */
    getInlinedFunctionRanges(rawLocation) {
        return this._sendRequest("getInlinedFunctionRanges" /* GetInlinedFunctionRanges */, { rawLocation });
    }
    /** Find locations in raw modules corresponding to inline functions
       *  called by the function or inline frame that rawLocation is in.
       */
    getInlinedCalleesRanges(rawLocation) {
        return this._sendRequest("getInlinedCalleesRanges" /* GetInlinedCalleesRanges */, { rawLocation });
    }
    getTypeInfo(expression, context) {
        return this._sendRequest("getTypeInfo" /* GetTypeInfo */, { expression, context });
    }
    getFormatter(expressionOrField, context) {
        return this._sendRequest("getFormatter" /* GetFormatter */, { expressionOrField, context });
    }
    getInspectableAddress(field) {
        return this._sendRequest("getInspectableAddress" /* GetInspectableAddress */, { field });
    }
    async getMappedLines(rawModuleId, sourceFileURL) {
        return this._sendRequest("getMappedLines" /* GetMappedLines */, { rawModuleId, sourceFileURL });
    }
    dispose() {
    }
}
