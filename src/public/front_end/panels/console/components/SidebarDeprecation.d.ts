export declare class SidebarDeprecation extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private readonly renderBound;
    connectedCallback(): void;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-console-sidebar-deprecation': SidebarDeprecation;
    }
}
