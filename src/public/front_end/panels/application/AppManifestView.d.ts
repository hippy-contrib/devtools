import * as Common from '../../core/common/common.js';
import type * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as InlineEditor from '../../ui/legacy/components/inline_editor/inline_editor.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as Protocol from '../../generated/protocol.js';
declare type ParsedSize = {
    any: 'any';
    formatted: string;
} | {
    width: number;
    height: number;
    formatted: string;
};
export declare class AppManifestView extends UI.Widget.VBox implements SDK.TargetManager.Observer {
    _emptyView: UI.EmptyWidget.EmptyWidget;
    _reportView: UI.ReportView.ReportView;
    _errorsSection: UI.ReportView.Section;
    _installabilitySection: UI.ReportView.Section;
    _identitySection: UI.ReportView.Section;
    _presentationSection: UI.ReportView.Section;
    _iconsSection: UI.ReportView.Section;
    _shortcutSections: UI.ReportView.Section[];
    _screenshotsSections: UI.ReportView.Section[];
    _nameField: HTMLElement;
    _shortNameField: HTMLElement;
    _descriptionField: Element;
    _startURLField: HTMLElement;
    _themeColorSwatch: InlineEditor.ColorSwatch.ColorSwatch;
    _backgroundColorSwatch: InlineEditor.ColorSwatch.ColorSwatch;
    _orientationField: HTMLElement;
    _displayField: HTMLElement;
    _newNoteUrlField: HTMLElement;
    _throttler: Common.Throttler.Throttler;
    _registeredListeners: Common.EventTarget.EventDescriptor[];
    _target?: SDK.Target.Target;
    _resourceTreeModel?: SDK.ResourceTreeModel.ResourceTreeModel | null;
    _serviceWorkerManager?: SDK.ServiceWorkerManager.ServiceWorkerManager | null;
    constructor();
    targetAdded(target: SDK.Target.Target): void;
    targetRemoved(target: SDK.Target.Target): void;
    _updateManifest(immediately: boolean): Promise<void>;
    _renderManifest(url: string, data: string | null, errors: Protocol.Page.AppManifestError[], installabilityErrors: Protocol.Page.InstallabilityError[], manifestIcons: {
        primaryIcon: string | null;
    }): Promise<void>;
    getInstallabilityErrorMessages(installabilityErrors: Protocol.Page.InstallabilityError[]): string[];
    _loadImage(url: string): Promise<{
        image: HTMLImageElement;
        wrapper: Element;
    } | null>;
    parseSizes(sizes: string, resourceName: Platform.UIString.LocalizedString, imageUrl: string, imageResourceErrors: Platform.UIString.LocalizedString[]): ParsedSize[];
    checkSizeProblem(size: ParsedSize, type: string | undefined, image: HTMLImageElement, resourceName: Platform.UIString.LocalizedString, imageUrl: string): {
        error?: Platform.UIString.LocalizedString;
        hasSquareSize: boolean;
    };
    _appendImageResourceToSection(baseUrl: string, imageResource: any, section: UI.ReportView.Section, isScreenshot: boolean): Promise<{
        imageResourceErrors: Platform.UIString.LocalizedString[];
        squareSizedIconAvailable?: boolean;
    }>;
}
export {};
