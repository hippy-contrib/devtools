/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
/* eslint-disable @typescript-eslint/naming-convention,rulesdir/no_underscored_properties */
import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as Platform from '../../core/platform/platform.js';
import * as Root from '../../core/root/root.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Logs from '../../models/logs/logs.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';
import * as Bindings from '../bindings/bindings.js';
import * as HAR from '../har/har.js';
import * as Workspace from '../workspace/workspace.js';
import { ExtensionButton, ExtensionPanel, ExtensionSidebarPane } from './ExtensionPanel.js';
import { ExtensionTraceProvider } from './ExtensionTraceProvider.js';
import { LanguageExtensionEndpoint } from './LanguageExtensionEndpoint.js';
const extensionOrigins = new WeakMap();
const kAllowedOrigins = [
    'chrome://newtab',
    'chrome://new-tab-page',
].map(url => (new URL(url)).origin);
let extensionServerInstance;
export class ExtensionServer extends Common.ObjectWrapper.ObjectWrapper {
    _clientObjects;
    _handlers;
    _subscribers;
    _subscriptionStartHandlers;
    _subscriptionStopHandlers;
    _extraHeaders;
    _requests;
    _requestIds;
    _lastRequestId;
    _registeredExtensions;
    _status;
    _sidebarPanes;
    _traceProviders;
    _traceSessions;
    _extensionsEnabled;
    _inspectedTabId;
    _extensionAPITestHook;
    constructor() {
        super();
        this._clientObjects = new Map();
        this._handlers = new Map();
        this._subscribers = new Map();
        this._subscriptionStartHandlers = new Map();
        this._subscriptionStopHandlers = new Map();
        this._extraHeaders = new Map();
        this._requests = new Map();
        this._requestIds = new Map();
        this._lastRequestId = 0;
        this._registeredExtensions = new Map();
        this._status = new ExtensionStatus();
        this._sidebarPanes = [];
        this._traceProviders = [];
        this._traceSessions = new Map();
        // TODO(caseq): properly unload extensions when we disable them.
        this._extensionsEnabled = true;
        this._registerHandler("addRequestHeaders" /* AddRequestHeaders */, this._onAddRequestHeaders.bind(this));
        this._registerHandler("addTraceProvider" /* AddTraceProvider */, this._onAddTraceProvider.bind(this));
        this._registerHandler("applyStyleSheet" /* ApplyStyleSheet */, this._onApplyStyleSheet.bind(this));
        this._registerHandler("completeTra.eSession" /* CompleteTraceSession */, this._onCompleteTraceSession.bind(this));
        this._registerHandler("createPanel" /* CreatePanel */, this._onCreatePanel.bind(this));
        this._registerHandler("createSidebarPane" /* CreateSidebarPane */, this._onCreateSidebarPane.bind(this));
        this._registerHandler("createToolbarButton" /* CreateToolbarButton */, this._onCreateToolbarButton.bind(this));
        this._registerHandler("evaluateOnInspectedPage" /* EvaluateOnInspectedPage */, this._onEvaluateOnInspectedPage.bind(this));
        this._registerHandler("_forwardKeyboardEvent" /* ForwardKeyboardEvent */, this._onForwardKeyboardEvent.bind(this));
        this._registerHandler("getHAR" /* GetHAR */, this._onGetHAR.bind(this));
        this._registerHandler("getPageResources" /* GetPageResources */, this._onGetPageResources.bind(this));
        this._registerHandler("getRequestContent" /* GetRequestContent */, this._onGetRequestContent.bind(this));
        this._registerHandler("getResourceContent" /* GetResourceContent */, this._onGetResourceContent.bind(this));
        this._registerHandler("Reload" /* Reload */, this._onReload.bind(this));
        this._registerHandler("setOpenResourceHandler" /* SetOpenResourceHandler */, this._onSetOpenResourceHandler.bind(this));
        this._registerHandler("setResourceContent" /* SetResourceContent */, this._onSetResourceContent.bind(this));
        this._registerHandler("setSidebarHeight" /* SetSidebarHeight */, this._onSetSidebarHeight.bind(this));
        this._registerHandler("setSidebarContent" /* SetSidebarContent */, this._onSetSidebarContent.bind(this));
        this._registerHandler("setSidebarPage" /* SetSidebarPage */, this._onSetSidebarPage.bind(this));
        this._registerHandler("showPanel" /* ShowPanel */, this._onShowPanel.bind(this));
        this._registerHandler("subscribe" /* Subscribe */, this._onSubscribe.bind(this));
        this._registerHandler("openResource" /* OpenResource */, this._onOpenResource.bind(this));
        this._registerHandler("unsubscribe" /* Unsubscribe */, this._onUnsubscribe.bind(this));
        this._registerHandler("updateButton" /* UpdateButton */, this._onUpdateButton.bind(this));
        this._registerHandler("registerLanguageExtensionPlugin" /* RegisterLanguageExtensionPlugin */, this._registerLanguageExtensionEndpoint.bind(this));
        window.addEventListener('message', this._onWindowMessage.bind(this), false); // Only for main window.
        const existingTabId = window.DevToolsAPI && window.DevToolsAPI.getInspectedTabId && window.DevToolsAPI.getInspectedTabId();
        if (existingTabId) {
            this._setInspectedTabId({ data: existingTabId });
        }
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(Host.InspectorFrontendHostAPI.Events.SetInspectedTabId, this._setInspectedTabId, this);
        this._initExtensions();
    }
    static instance(opts = { forceNew: null }) {
        const { forceNew } = opts;
        if (!extensionServerInstance || forceNew) {
            extensionServerInstance = new ExtensionServer();
        }
        return extensionServerInstance;
    }
    initializeExtensions() {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.setAddExtensionCallback(this._addExtension.bind(this));
    }
    hasExtensions() {
        return Boolean(this._registeredExtensions.size);
    }
    notifySearchAction(panelId, action, searchString) {
        this._postNotification("panel-search-" /* PanelSearch */ + panelId, action, searchString);
    }
    notifyViewShown(identifier, frameIndex) {
        this._postNotification("view-shown-" /* ViewShown */ + identifier, frameIndex);
    }
    notifyViewHidden(identifier) {
        this._postNotification("view-hidden," /* ViewHidden */ + identifier);
    }
    notifyButtonClicked(identifier) {
        this._postNotification("button-clicked-" /* ButtonClicked */ + identifier);
    }
    _registerLanguageExtensionEndpoint(message, _shared_port) {
        if (message.command !== "registerLanguageExtensionPlugin" /* RegisterLanguageExtensionPlugin */) {
            return this._status.E_BADARG('command', `expected ${"subscribe" /* Subscribe */}`);
        }
        const { pluginManager } = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
        if (!pluginManager) {
            return this._status.E_FAILED('WebAssembly DWARF support needs to be enabled to use this extension');
        }
        const { pluginName, port, supportedScriptTypes: { language, symbol_types } } = message;
        const symbol_types_array = (Array.isArray(symbol_types) && symbol_types.every(e => typeof e === 'string') ? symbol_types : []);
        const endpoint = new LanguageExtensionEndpoint(pluginName, { language, symbol_types: symbol_types_array }, port);
        pluginManager.addPlugin(endpoint);
        return this._status.OK();
    }
    _inspectedURLChanged(event) {
        if (!this._canInspectURL(event.data.inspectedURL())) {
            this._disableExtensions();
            return;
        }
        if (event.data !== SDK.TargetManager.TargetManager.instance().mainTarget()) {
            return;
        }
        this._requests = new Map();
        const url = event.data.inspectedURL();
        this._postNotification("inspected-url-changed" /* InspectedURLChanged */, url);
    }
    startTraceRecording(providerId, sessionId, session) {
        this._traceSessions.set(sessionId, session);
        this._postNotification('trace-recording-started-' + providerId, sessionId);
    }
    stopTraceRecording(providerId) {
        this._postNotification('trace-recording-stopped-' + providerId);
    }
    hasSubscribers(type) {
        return this._subscribers.has(type);
    }
    _postNotification(type, ..._vararg) {
        if (!this._extensionsEnabled) {
            return;
        }
        const subscribers = this._subscribers.get(type);
        if (!subscribers) {
            return;
        }
        const message = { command: 'notify-' + type, arguments: Array.prototype.slice.call(arguments, 1) };
        for (const subscriber of subscribers) {
            subscriber.postMessage(message);
        }
    }
    _onSubscribe(message, port) {
        if (message.command !== "subscribe" /* Subscribe */) {
            return this._status.E_BADARG('command', `expected ${"subscribe" /* Subscribe */}`);
        }
        const subscribers = this._subscribers.get(message.type);
        if (subscribers) {
            subscribers.add(port);
        }
        else {
            this._subscribers.set(message.type, new Set([port]));
            const handler = this._subscriptionStartHandlers.get(message.type);
            if (handler) {
                handler();
            }
        }
        return undefined;
    }
    _onUnsubscribe(message, port) {
        if (message.command !== "unsubscribe" /* Unsubscribe */) {
            return this._status.E_BADARG('command', `expected ${"unsubscribe" /* Unsubscribe */}`);
        }
        const subscribers = this._subscribers.get(message.type);
        if (!subscribers) {
            return;
        }
        subscribers.delete(port);
        if (!subscribers.size) {
            this._subscribers.delete(message.type);
            const handler = this._subscriptionStopHandlers.get(message.type);
            if (handler) {
                handler();
            }
        }
        return undefined;
    }
    _onAddRequestHeaders(message) {
        if (message.command !== "addRequestHeaders" /* AddRequestHeaders */) {
            return this._status.E_BADARG('command', `expected ${"addRequestHeaders" /* AddRequestHeaders */}`);
        }
        const id = message.extensionId;
        if (typeof id !== 'string') {
            return this._status.E_BADARGTYPE('extensionId', typeof id, 'string');
        }
        let extensionHeaders = this._extraHeaders.get(id);
        if (!extensionHeaders) {
            extensionHeaders = new Map();
            this._extraHeaders.set(id, extensionHeaders);
        }
        for (const name in message.headers) {
            extensionHeaders.set(name, message.headers[name]);
        }
        const allHeaders = {};
        for (const headers of this._extraHeaders.values()) {
            for (const [name, value] of headers) {
                if (name !== '__proto__' && typeof value === 'string') {
                    allHeaders[name] = value;
                }
            }
        }
        SDK.NetworkManager.MultitargetNetworkManager.instance().setExtraHTTPHeaders(allHeaders);
        return undefined;
    }
    _onApplyStyleSheet(message) {
        if (message.command !== "applyStyleSheet" /* ApplyStyleSheet */) {
            return this._status.E_BADARG('command', `expected ${"applyStyleSheet" /* ApplyStyleSheet */}`);
        }
        if (!Root.Runtime.experiments.isEnabled('applyCustomStylesheet')) {
            return;
        }
        const styleSheet = document.createElement('style');
        styleSheet.textContent = message.styleSheet;
        document.head.appendChild(styleSheet);
        ThemeSupport.ThemeSupport.instance().addCustomStylesheet(message.styleSheet);
        // Add to all the shadow roots that have already been created
        for (let node = document.body; node; node = node.traverseNextNode(document.body)) {
            if (node instanceof ShadowRoot) {
                ThemeSupport.ThemeSupport.instance().injectCustomStyleSheets(node);
            }
        }
        return undefined;
    }
    getExtensionOrigin(port) {
        const origin = extensionOrigins.get(port);
        if (!origin) {
            throw new Error('Received a message from an unregistered extension');
        }
        return origin;
    }
    _onCreatePanel(message, port) {
        if (message.command !== "createPanel" /* CreatePanel */) {
            return this._status.E_BADARG('command', `expected ${"createPanel" /* CreatePanel */}`);
        }
        const id = message.id;
        // The ids are generated on the client API side and must be unique, so the check below
        // shouldn't be hit unless someone is bypassing the API.
        if (this._clientObjects.has(id) || UI.InspectorView.InspectorView.instance().hasPanel(id)) {
            return this._status.E_EXISTS(id);
        }
        const page = this._expandResourcePath(this.getExtensionOrigin(port), message.page);
        let persistentId = this.getExtensionOrigin(port) + message.title;
        persistentId = persistentId.replace(/\s/g, '');
        const panelView = new ExtensionServerPanelView(persistentId, message.title, new ExtensionPanel(this, persistentId, id, page));
        this._clientObjects.set(id, panelView);
        UI.InspectorView.InspectorView.instance().addPanel(panelView);
        return this._status.OK();
    }
    _onShowPanel(message) {
        if (message.command !== "showPanel" /* ShowPanel */) {
            return this._status.E_BADARG('command', `expected ${"showPanel" /* ShowPanel */}`);
        }
        let panelViewId = message.id;
        const panelView = this._clientObjects.get(message.id);
        if (panelView && panelView instanceof ExtensionServerPanelView) {
            panelViewId = panelView.viewId();
        }
        UI.InspectorView.InspectorView.instance().showPanel(panelViewId);
        return undefined;
    }
    _onCreateToolbarButton(message, port) {
        if (message.command !== "createToolbarButton" /* CreateToolbarButton */) {
            return this._status.E_BADARG('command', `expected ${"createToolbarButton" /* CreateToolbarButton */}`);
        }
        const panelView = this._clientObjects.get(message.panel);
        if (!panelView || !(panelView instanceof ExtensionServerPanelView)) {
            return this._status.E_NOTFOUND(message.panel);
        }
        const button = new ExtensionButton(this, message.id, this._expandResourcePath(this.getExtensionOrigin(port), message.icon), message.tooltip, message.disabled);
        this._clientObjects.set(message.id, button);
        panelView.widget().then(appendButton);
        function appendButton(panel) {
            panel.addToolbarItem(button.toolbarButton());
        }
        return this._status.OK();
    }
    _onUpdateButton(message, port) {
        if (message.command !== "updateButton" /* UpdateButton */) {
            return this._status.E_BADARG('command', `expected ${"updateButton" /* UpdateButton */}`);
        }
        const button = this._clientObjects.get(message.id);
        if (!button || !(button instanceof ExtensionButton)) {
            return this._status.E_NOTFOUND(message.id);
        }
        button.update(message.icon && this._expandResourcePath(this.getExtensionOrigin(port), message.icon), message.tooltip, message.disabled);
        return this._status.OK();
    }
    _onCompleteTraceSession(message) {
        if (message.command !== "completeTra.eSession" /* CompleteTraceSession */) {
            return this._status.E_BADARG('command', `expected ${"completeTra.eSession" /* CompleteTraceSession */}`);
        }
        const session = this._traceSessions.get(message.id);
        if (!session) {
            return this._status.E_NOTFOUND(message.id);
        }
        this._traceSessions.delete(message.id);
        session.complete(message.url, message.timeOffset);
        return undefined;
    }
    _onCreateSidebarPane(message) {
        if (message.command !== "createSidebarPane" /* CreateSidebarPane */) {
            return this._status.E_BADARG('command', `expected ${"createSidebarPane" /* CreateSidebarPane */}`);
        }
        const id = message.id;
        const sidebar = new ExtensionSidebarPane(this, message.panel, message.title, id);
        this._sidebarPanes.push(sidebar);
        this._clientObjects.set(id, sidebar);
        this.dispatchEventToListeners(Events.SidebarPaneAdded, sidebar);
        return this._status.OK();
    }
    sidebarPanes() {
        return this._sidebarPanes;
    }
    _onSetSidebarHeight(message) {
        if (message.command !== "setSidebarHeight" /* SetSidebarHeight */) {
            return this._status.E_BADARG('command', `expected ${"setSidebarHeight" /* SetSidebarHeight */}`);
        }
        const sidebar = this._clientObjects.get(message.id);
        if (!sidebar || !(sidebar instanceof ExtensionSidebarPane)) {
            return this._status.E_NOTFOUND(message.id);
        }
        sidebar.setHeight(message.height);
        return this._status.OK();
    }
    _onSetSidebarContent(message, port) {
        if (message.command !== "setSidebarContent" /* SetSidebarContent */) {
            return this._status.E_BADARG('command', `expected ${"setSidebarContent" /* SetSidebarContent */}`);
        }
        const { requestId, id, rootTitle, expression, evaluateOptions, evaluateOnPage } = message;
        const sidebar = this._clientObjects.get(id);
        if (!sidebar || !(sidebar instanceof ExtensionSidebarPane)) {
            return this._status.E_NOTFOUND(message.id);
        }
        function callback(error) {
            const result = error ? this._status.E_FAILED(error) : this._status.OK();
            this._dispatchCallback(requestId, port, result);
        }
        if (evaluateOnPage) {
            sidebar.setExpression(expression, rootTitle, evaluateOptions, this.getExtensionOrigin(port), callback.bind(this));
            return undefined;
        }
        sidebar.setObject(message.expression, message.rootTitle, callback.bind(this));
        return undefined;
    }
    _onSetSidebarPage(message, port) {
        if (message.command !== "setSidebarPage" /* SetSidebarPage */) {
            return this._status.E_BADARG('command', `expected ${"setSidebarPage" /* SetSidebarPage */}`);
        }
        const sidebar = this._clientObjects.get(message.id);
        if (!sidebar || !(sidebar instanceof ExtensionSidebarPane)) {
            return this._status.E_NOTFOUND(message.id);
        }
        sidebar.setPage(this._expandResourcePath(this.getExtensionOrigin(port), message.page));
        return undefined;
    }
    _onOpenResource(message) {
        if (message.command !== "openResource" /* OpenResource */) {
            return this._status.E_BADARG('command', `expected ${"openResource" /* OpenResource */}`);
        }
        const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(message.url);
        if (uiSourceCode) {
            Common.Revealer.reveal(uiSourceCode.uiLocation(message.lineNumber, 0));
            return this._status.OK();
        }
        const resource = Bindings.ResourceUtils.resourceForURL(message.url);
        if (resource) {
            Common.Revealer.reveal(resource);
            return this._status.OK();
        }
        const request = Logs.NetworkLog.NetworkLog.instance().requestForURL(message.url);
        if (request) {
            Common.Revealer.reveal(request);
            return this._status.OK();
        }
        return this._status.E_NOTFOUND(message.url);
    }
    _onSetOpenResourceHandler(message, port) {
        if (message.command !== "setOpenResourceHandler" /* SetOpenResourceHandler */) {
            return this._status.E_BADARG('command', `expected ${"setOpenResourceHandler" /* SetOpenResourceHandler */}`);
        }
        const extension = this._registeredExtensions.get(this.getExtensionOrigin(port));
        if (!extension) {
            throw new Error('Received a message from an unregistered extension');
        }
        const { name } = extension;
        if (message.handlerPresent) {
            Components.Linkifier.Linkifier.registerLinkHandler(name, this._handleOpenURL.bind(this, port));
        }
        else {
            Components.Linkifier.Linkifier.unregisterLinkHandler(name);
        }
        return undefined;
    }
    _handleOpenURL(port, contentProvider, lineNumber) {
        port.postMessage({ command: 'open-resource', resource: this._makeResource(contentProvider), lineNumber: lineNumber + 1 });
    }
    _onReload(message) {
        if (message.command !== "Reload" /* Reload */) {
            return this._status.E_BADARG('command', `expected ${"Reload" /* Reload */}`);
        }
        const options = (message.options || {});
        SDK.NetworkManager.MultitargetNetworkManager.instance().setUserAgentOverride(typeof options.userAgent === 'string' ? options.userAgent : '', null);
        let injectedScript;
        if (options.injectedScript) {
            injectedScript = '(function(){' + options.injectedScript + '})()';
        }
        SDK.ResourceTreeModel.ResourceTreeModel.reloadAllPages(Boolean(options.ignoreCache), injectedScript);
        return this._status.OK();
    }
    _onEvaluateOnInspectedPage(message, port) {
        if (message.command !== "evaluateOnInspectedPage" /* EvaluateOnInspectedPage */) {
            return this._status.E_BADARG('command', `expected ${"evaluateOnInspectedPage" /* EvaluateOnInspectedPage */}`);
        }
        const { requestId, expression, evaluateOptions } = message;
        function callback(error, object, wasThrown) {
            let result;
            if (error || !object) {
                result = this._status.E_PROTOCOLERROR(error?.toString());
            }
            else if (wasThrown) {
                result = { isException: true, value: object.description };
            }
            else {
                result = { value: object.value };
            }
            this._dispatchCallback(requestId, port, result);
        }
        return this.evaluate(expression, true, true, evaluateOptions, this.getExtensionOrigin(port), callback.bind(this));
    }
    async _onGetHAR(message) {
        if (message.command !== "getHAR" /* GetHAR */) {
            return this._status.E_BADARG('command', `expected ${"getHAR" /* GetHAR */}`);
        }
        const requests = Logs.NetworkLog.NetworkLog.instance().requests();
        const harLog = await HAR.Log.Log.build(requests);
        for (let i = 0; i < harLog.entries.length; ++i) {
            // @ts-ignore
            harLog.entries[i]._requestId = this._requestId(requests[i]);
        }
        return harLog;
    }
    _makeResource(contentProvider) {
        return { url: contentProvider.contentURL(), type: contentProvider.contentType().name() };
    }
    _onGetPageResources() {
        const resources = new Map();
        function pushResourceData(contentProvider) {
            if (!resources.has(contentProvider.contentURL())) {
                resources.set(contentProvider.contentURL(), this._makeResource(contentProvider));
            }
            return false;
        }
        let uiSourceCodes = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodesForProjectType(Workspace.Workspace.projectTypes.Network);
        uiSourceCodes = uiSourceCodes.concat(Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodesForProjectType(Workspace.Workspace.projectTypes.ContentScripts));
        uiSourceCodes.forEach(pushResourceData.bind(this));
        for (const resourceTreeModel of SDK.TargetManager.TargetManager.instance().models(SDK.ResourceTreeModel.ResourceTreeModel)) {
            resourceTreeModel.forAllResources(pushResourceData.bind(this));
        }
        return [...resources.values()];
    }
    async _getResourceContent(contentProvider, message, port) {
        const { content } = await contentProvider.requestContent();
        const encoded = await contentProvider.contentEncoded();
        this._dispatchCallback(message.requestId, port, { encoding: encoded ? 'base64' : '', content: content });
    }
    _onGetRequestContent(message, port) {
        if (message.command !== "getRequestContent" /* GetRequestContent */) {
            return this._status.E_BADARG('command', `expected ${"getRequestContent" /* GetRequestContent */}`);
        }
        const request = this._requestById(message.id);
        if (!request) {
            return this._status.E_NOTFOUND(message.id);
        }
        this._getResourceContent(request, message, port);
        return undefined;
    }
    _onGetResourceContent(message, port) {
        if (message.command !== "getResourceContent" /* GetResourceContent */) {
            return this._status.E_BADARG('command', `expected ${"getResourceContent" /* GetResourceContent */}`);
        }
        const url = message.url;
        const contentProvider = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url) ||
            Bindings.ResourceUtils.resourceForURL(url);
        if (!contentProvider) {
            return this._status.E_NOTFOUND(url);
        }
        this._getResourceContent(contentProvider, message, port);
        return undefined;
    }
    _onSetResourceContent(message, port) {
        if (message.command !== "setResourceContent" /* SetResourceContent */) {
            return this._status.E_BADARG('command', `expected ${"setResourceContent" /* SetResourceContent */}`);
        }
        const { url, requestId, content, commit } = message;
        function callbackWrapper(error) {
            const response = error ? this._status.E_FAILED(error) : this._status.OK();
            this._dispatchCallback(requestId, port, response);
        }
        const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url);
        if (!uiSourceCode || !uiSourceCode.contentType().isDocumentOrScriptOrStyleSheet()) {
            const resource = SDK.ResourceTreeModel.ResourceTreeModel.resourceForURL(url);
            if (!resource) {
                return this._status.E_NOTFOUND(url);
            }
            return this._status.E_NOTSUPPORTED('Resource is not editable');
        }
        uiSourceCode.setWorkingCopy(content);
        if (commit) {
            uiSourceCode.commitWorkingCopy();
        }
        callbackWrapper.call(this, null);
        return undefined;
    }
    _requestId(request) {
        const requestId = this._requestIds.get(request);
        if (requestId === undefined) {
            const newId = ++this._lastRequestId;
            this._requestIds.set(request, newId);
            this._requests.set(newId, request);
            return newId;
        }
        return requestId;
    }
    _requestById(id) {
        return this._requests.get(id);
    }
    _onAddTraceProvider(message, port) {
        if (message.command !== "addTraceProvider" /* AddTraceProvider */) {
            return this._status.E_BADARG('command', `expected ${"addTraceProvider" /* AddTraceProvider */}`);
        }
        const provider = new ExtensionTraceProvider(this.getExtensionOrigin(port), message.id, message.categoryName, message.categoryTooltip);
        this._clientObjects.set(message.id, provider);
        this._traceProviders.push(provider);
        this.dispatchEventToListeners(Events.TraceProviderAdded, provider);
        return undefined;
    }
    traceProviders() {
        return this._traceProviders;
    }
    _onForwardKeyboardEvent(message) {
        if (message.command !== "_forwardKeyboardEvent" /* ForwardKeyboardEvent */) {
            return this._status.E_BADARG('command', `expected ${"_forwardKeyboardEvent" /* ForwardKeyboardEvent */}`);
        }
        message.entries.forEach(handleEventEntry);
        function handleEventEntry(entry) {
            // Fool around closure compiler -- it has its own notion of both KeyboardEvent constructor
            // and initKeyboardEvent methods and overriding these in externs.js does not have effect.
            const event = new window.KeyboardEvent(entry.eventType, {
                key: entry.key,
                code: entry.code,
                keyCode: entry.keyCode,
                location: entry.location,
                ctrlKey: entry.ctrlKey,
                altKey: entry.altKey,
                shiftKey: entry.shiftKey,
                metaKey: entry.metaKey,
            });
            // @ts-ignore
            event.__keyCode = keyCodeForEntry(entry);
            document.dispatchEvent(event);
        }
        function keyCodeForEntry(entry) {
            let keyCode = entry.keyCode;
            if (!keyCode) {
                // This is required only for synthetic events (e.g. dispatched in tests).
                if (entry.key === Platform.KeyboardUtilities.ESCAPE_KEY) {
                    keyCode = 27;
                }
            }
            return keyCode || 0;
        }
        return undefined;
    }
    _dispatchCallback(requestId, port, result) {
        if (requestId) {
            port.postMessage({ command: 'callback', requestId: requestId, result: result });
        }
    }
    _initExtensions() {
        this._registerAutosubscriptionHandler("resource-added" /* ResourceAdded */, Workspace.Workspace.WorkspaceImpl.instance(), Workspace.Workspace.Events.UISourceCodeAdded, this._notifyResourceAdded);
        this._registerAutosubscriptionTargetManagerHandler("network-request-finished" /* NetworkRequestFinished */, SDK.NetworkManager.NetworkManager, SDK.NetworkManager.Events.RequestFinished, this._notifyRequestFinished);
        function onElementsSubscriptionStarted() {
            UI.Context.Context.instance().addFlavorChangeListener(SDK.DOMModel.DOMNode, this._notifyElementsSelectionChanged, this);
        }
        function onElementsSubscriptionStopped() {
            UI.Context.Context.instance().removeFlavorChangeListener(SDK.DOMModel.DOMNode, this._notifyElementsSelectionChanged, this);
        }
        this._registerSubscriptionHandler("panel-objectSelected-" /* PanelObjectSelected */ + 'elements', onElementsSubscriptionStarted.bind(this), onElementsSubscriptionStopped.bind(this));
        this._registerResourceContentCommittedHandler(this._notifyUISourceCodeContentCommitted);
        SDK.TargetManager.TargetManager.instance().addEventListener(SDK.TargetManager.Events.InspectedURLChanged, this._inspectedURLChanged, this);
    }
    _notifyResourceAdded(event) {
        const uiSourceCode = event.data;
        this._postNotification("resource-added" /* ResourceAdded */, this._makeResource(uiSourceCode));
    }
    _notifyUISourceCodeContentCommitted(event) {
        const { uiSourceCode, content } = event.data;
        this._postNotification("resource-content-committed" /* ResourceContentCommitted */, this._makeResource(uiSourceCode), content);
    }
    async _notifyRequestFinished(event) {
        const request = event.data;
        const entry = await HAR.Log.Entry.build(request);
        this._postNotification("network-request-finished" /* NetworkRequestFinished */, this._requestId(request), entry);
    }
    _notifyElementsSelectionChanged() {
        this._postNotification("panel-objectSelected-" /* PanelObjectSelected */ + 'elements');
    }
    sourceSelectionChanged(url, range) {
        this._postNotification("panel-objectSelected-" /* PanelObjectSelected */ + 'sources', {
            startLine: range.startLine,
            startColumn: range.startColumn,
            endLine: range.endLine,
            endColumn: range.endColumn,
            url: url,
        });
    }
    _setInspectedTabId(event) {
        this._inspectedTabId = event.data;
    }
    _addExtension(extensionInfo) {
        const startPage = extensionInfo.startPage;
        const inspectedURL = SDK.TargetManager.TargetManager.instance().mainTarget()?.inspectedURL() ?? '';
        if (inspectedURL !== '' && !this._canInspectURL(inspectedURL)) {
            this._disableExtensions();
        }
        if (!this._extensionsEnabled) {
            return;
        }
        try {
            const startPageURL = new URL(startPage);
            const extensionOrigin = startPageURL.origin;
            if (!this._registeredExtensions.get(extensionOrigin)) {
                // See ExtensionAPI.js for details.
                const injectedAPI = self.buildExtensionAPIInjectedScript(extensionInfo, this._inspectedTabId, ThemeSupport.ThemeSupport.instance().themeName(), UI.ShortcutRegistry.ShortcutRegistry.instance().globalShortcutKeys(), ExtensionServer.instance()._extensionAPITestHook);
                Host.InspectorFrontendHost.InspectorFrontendHostInstance.setInjectedScriptForOrigin(extensionOrigin, injectedAPI);
                const name = extensionInfo.name || `Extension ${extensionOrigin}`;
                this._registeredExtensions.set(extensionOrigin, { name });
            }
            const iframe = document.createElement('iframe');
            iframe.src = startPage;
            iframe.dataset.devtoolsExtension = extensionInfo.name;
            iframe.style.display = 'none';
            document.body.appendChild(iframe); // Only for main window.
        }
        catch (e) {
            console.error('Failed to initialize extension ' + startPage + ':' + e);
            return false;
        }
        return true;
    }
    _registerExtension(origin, port) {
        if (!this._registeredExtensions.has(origin)) {
            if (origin !== window.location.origin) { // Just ignore inspector frames.
                console.error('Ignoring unauthorized client request from ' + origin);
            }
            return;
        }
        extensionOrigins.set(port, origin);
        port.addEventListener('message', this._onmessage.bind(this), false);
        port.start();
    }
    _onWindowMessage(event) {
        if (event.data === 'registerExtension') {
            this._registerExtension(event.origin, event.ports[0]);
        }
    }
    async _onmessage(event) {
        const message = event.data;
        let result;
        const handler = this._handlers.get(message.command);
        if (!handler) {
            result = this._status.E_NOTSUPPORTED(message.command);
        }
        else if (!this._extensionsEnabled) {
            result = this._status.E_FAILED('Permission denied');
        }
        else {
            result = await handler(message, event.target);
        }
        if (result && message.requestId) {
            this._dispatchCallback(message.requestId, event.target, result);
        }
    }
    _registerHandler(command, callback) {
        console.assert(Boolean(command));
        this._handlers.set(command, callback);
    }
    _registerSubscriptionHandler(eventTopic, onSubscribeFirst, onUnsubscribeLast) {
        this._subscriptionStartHandlers.set(eventTopic, onSubscribeFirst);
        this._subscriptionStopHandlers.set(eventTopic, onUnsubscribeLast);
    }
    _registerAutosubscriptionHandler(eventTopic, eventTarget, frontendEventType, handler) {
        this._registerSubscriptionHandler(eventTopic, () => eventTarget.addEventListener(frontendEventType, handler, this), eventTarget.removeEventListener.bind(eventTarget, frontendEventType, handler, this));
    }
    _registerAutosubscriptionTargetManagerHandler(eventTopic, modelClass, frontendEventType, handler) {
        this._registerSubscriptionHandler(eventTopic, SDK.TargetManager.TargetManager.instance().addModelListener.bind(SDK.TargetManager.TargetManager.instance(), modelClass, frontendEventType, handler, this), SDK.TargetManager.TargetManager.instance().removeModelListener.bind(SDK.TargetManager.TargetManager.instance(), modelClass, frontendEventType, handler, this));
    }
    _registerResourceContentCommittedHandler(handler) {
        function addFirstEventListener() {
            Workspace.Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Workspace.Events.WorkingCopyCommittedByUser, handler, this);
            Workspace.Workspace.WorkspaceImpl.instance().setHasResourceContentTrackingExtensions(true);
        }
        function removeLastEventListener() {
            Workspace.Workspace.WorkspaceImpl.instance().setHasResourceContentTrackingExtensions(false);
            Workspace.Workspace.WorkspaceImpl.instance().removeEventListener(Workspace.Workspace.Events.WorkingCopyCommittedByUser, handler, this);
        }
        this._registerSubscriptionHandler("resource-content-committed" /* ResourceContentCommitted */, addFirstEventListener.bind(this), removeLastEventListener.bind(this));
    }
    _expandResourcePath(extensionPath, resourcePath) {
        return extensionPath + this._normalizePath(resourcePath);
    }
    _normalizePath(path) {
        const source = path.split('/');
        const result = [];
        for (let i = 0; i < source.length; ++i) {
            if (source[i] === '.') {
                continue;
            }
            // Ignore empty path components resulting from //, as well as a leading and traling slashes.
            if (source[i] === '') {
                continue;
            }
            if (source[i] === '..') {
                result.pop();
            }
            else {
                result.push(source[i]);
            }
        }
        return '/' + result.join('/');
    }
    evaluate(expression, exposeCommandLineAPI, returnByValue, options, securityOrigin, callback) {
        let context;
        function resolveURLToFrame(url) {
            let found = null;
            function hasMatchingURL(frame) {
                found = (frame.url === url) ? frame : null;
                return found;
            }
            SDK.ResourceTreeModel.ResourceTreeModel.frames().some(hasMatchingURL);
            return found;
        }
        options = options || {};
        let frame;
        if (options.frameURL) {
            frame = resolveURLToFrame(options.frameURL);
        }
        else {
            const target = SDK.TargetManager.TargetManager.instance().mainTarget();
            const resourceTreeModel = target && target.model(SDK.ResourceTreeModel.ResourceTreeModel);
            frame = resourceTreeModel && resourceTreeModel.mainFrame;
        }
        if (!frame) {
            if (options.frameURL) {
                console.warn('evaluate: there is no frame with URL ' + options.frameURL);
            }
            else {
                console.warn('evaluate: the main frame is not yet available');
            }
            return this._status.E_NOTFOUND(options.frameURL || '<top>');
        }
        // We shouldn't get here if the top frame can't be inspected by an extension, but
        // let's double check for subframes.
        if (!this._canInspectURL(frame.url)) {
            return this._status.E_FAILED('Permission denied');
        }
        let contextSecurityOrigin;
        if (options.useContentScriptContext) {
            contextSecurityOrigin = securityOrigin;
        }
        else if (options.scriptExecutionContext) {
            contextSecurityOrigin = options.scriptExecutionContext;
        }
        const runtimeModel = frame.resourceTreeModel().target().model(SDK.RuntimeModel.RuntimeModel);
        const executionContexts = runtimeModel ? runtimeModel.executionContexts() : [];
        if (contextSecurityOrigin) {
            for (let i = 0; i < executionContexts.length; ++i) {
                const executionContext = executionContexts[i];
                if (executionContext.frameId === frame.id && executionContext.origin === contextSecurityOrigin &&
                    !executionContext.isDefault) {
                    context = executionContext;
                }
            }
            if (!context) {
                console.warn('The JavaScript context ' + contextSecurityOrigin + ' was not found in the frame ' + frame.url);
                return this._status.E_NOTFOUND(contextSecurityOrigin);
            }
        }
        else {
            for (let i = 0; i < executionContexts.length; ++i) {
                const executionContext = executionContexts[i];
                if (executionContext.frameId === frame.id && executionContext.isDefault) {
                    context = executionContext;
                }
            }
            if (!context) {
                return this._status.E_FAILED(frame.url + ' has no execution context');
            }
        }
        if (!this._canInspectURL(context.origin)) {
            return this._status.E_FAILED('Permission denied');
        }
        context
            .evaluate({
            expression: expression,
            objectGroup: 'extension',
            includeCommandLineAPI: exposeCommandLineAPI,
            silent: true,
            returnByValue: returnByValue,
            generatePreview: false,
        }, 
        /* userGesture */ false, /* awaitPromise */ false)
            .then(onEvaluate);
        function onEvaluate(result) {
            if ('error' in result) {
                callback(result.error, null, false);
                return;
            }
            callback(null, result.object || null, Boolean(result.exceptionDetails));
        }
        return undefined;
    }
    _canInspectURL(url) {
        let parsedURL;
        // This is only to work around invalid URLs we're occasionally getting from some tests.
        // TODO(caseq): make sure tests supply valid URLs or we specifically handle invalid ones.
        try {
            parsedURL = new URL(url);
        }
        catch (exception) {
            return false;
        }
        if (kAllowedOrigins.includes(parsedURL.origin)) {
            return true;
        }
        if (parsedURL.protocol === 'chrome:' || parsedURL.protocol === 'devtools:') {
            return false;
        }
        if (parsedURL.protocol.startsWith('http') && parsedURL.hostname === 'chrome.google.com' &&
            parsedURL.pathname.startsWith('/webstore')) {
            return false;
        }
        return true;
    }
    _disableExtensions() {
        this._extensionsEnabled = false;
    }
}
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var Events;
(function (Events) {
    Events["SidebarPaneAdded"] = "SidebarPaneAdded";
    Events["TraceProviderAdded"] = "TraceProviderAdded";
})(Events || (Events = {}));
class ExtensionServerPanelView extends UI.View.SimpleView {
    _name;
    _panel;
    constructor(name, title, panel) {
        super(title);
        this._name = name;
        this._panel = panel;
    }
    viewId() {
        return this._name;
    }
    widget() {
        return Promise.resolve(this._panel);
    }
}
export class ExtensionStatus {
    OK;
    E_EXISTS;
    E_BADARG;
    E_BADARGTYPE;
    E_NOTFOUND;
    E_NOTSUPPORTED;
    E_PROTOCOLERROR;
    E_FAILED;
    constructor() {
        function makeStatus(code, description) {
            const details = Array.prototype.slice.call(arguments, 2);
            const status = { code, description, details };
            if (code !== 'OK') {
                status.isError = true;
                console.error('Extension server error: ' + Platform.StringUtilities.vsprintf(description, details));
            }
            return status;
        }
        this.OK = makeStatus.bind(null, 'OK', 'OK');
        this.E_EXISTS = makeStatus.bind(null, 'E_EXISTS', 'Object already exists: %s');
        this.E_BADARG = makeStatus.bind(null, 'E_BADARG', 'Invalid argument %s: %s');
        this.E_BADARGTYPE = makeStatus.bind(null, 'E_BADARGTYPE', 'Invalid type for argument %s: got %s, expected %s');
        this.E_NOTFOUND = makeStatus.bind(null, 'E_NOTFOUND', 'Object not found: %s');
        this.E_NOTSUPPORTED = makeStatus.bind(null, 'E_NOTSUPPORTED', 'Object does not support requested operation: %s');
        this.E_PROTOCOLERROR = makeStatus.bind(null, 'E_PROTOCOLERROR', 'Inspector protocol error: %s');
        this.E_FAILED = makeStatus.bind(null, 'E_FAILED', 'Operation failed: %s');
    }
}
