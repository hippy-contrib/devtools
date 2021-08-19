export interface HiddenIssuesMenuData {
    issueCode: string;
}
export declare class HideIssuesMenu extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private code;
    private visible;
    private hideIssueSetting;
    set data(data: HiddenIssuesMenuData);
    connectedCallback(): void;
    setVisible(x: boolean): void;
    onMenuOpen(event: Event): void;
    onHideIssueByCode(): void;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-hide-issues-menu': HideIssuesMenu;
    }
}
