export declare class Tooltip {
    _anchorElement?: Element;
    _tooltipLastOpened?: number;
    _tooltipLastClosed?: number;
    static install(element: HTMLElement, tooltipContent: string | null, _actionId?: string, _options?: TooltipOptions | null): void;
}
export interface TooltipOptions {
    anchorTooltipAtElement?: boolean;
}
