import * as Common from '../../core/common/common.js';
export interface FormattedContent {
    content: string;
    mapping: FormatterSourceMapping;
}
export declare function format(contentType: Common.ResourceType.ResourceType, mimeType: string, content: string): Promise<FormattedContent>;
export declare function formatScriptContent(mimeType: string, content: string): Promise<FormattedContent>;
export interface FormatterSourceMapping {
    originalToFormatted(lineNumber: number, columnNumber?: number): number[];
    formattedToOriginal(lineNumber: number, columnNumber?: number): number[];
}
