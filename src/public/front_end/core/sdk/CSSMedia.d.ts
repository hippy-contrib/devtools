import * as TextUtils from '../../models/text_utils/text_utils.js';
import type * as Protocol from '../../generated/protocol.js';
import type { CSSModel } from './CSSModel.js';
import { CSSQuery } from './CSSQuery.js';
export declare class CSSMediaQuery {
    _active: boolean;
    _expressions: CSSMediaQueryExpression[] | null;
    constructor(payload: Protocol.CSS.MediaQuery);
    static parsePayload(payload: Protocol.CSS.MediaQuery): CSSMediaQuery;
    active(): boolean;
    expressions(): CSSMediaQueryExpression[] | null;
}
export declare class CSSMediaQueryExpression {
    _value: number;
    _unit: string;
    _feature: string;
    _valueRange: TextUtils.TextRange.TextRange | null;
    _computedLength: number | null;
    constructor(payload: Protocol.CSS.MediaQueryExpression);
    static parsePayload(payload: Protocol.CSS.MediaQueryExpression): CSSMediaQueryExpression;
    value(): number;
    unit(): string;
    feature(): string;
    valueRange(): TextUtils.TextRange.TextRange | null;
    computedLength(): number | null;
}
export declare class CSSMedia extends CSSQuery {
    source?: Protocol.CSS.CSSMediaSource;
    sourceURL?: string;
    mediaList?: CSSMediaQuery[] | null;
    static parseMediaArrayPayload(cssModel: CSSModel, payload: Protocol.CSS.CSSMedia[]): CSSMedia[];
    constructor(cssModel: CSSModel, payload: Protocol.CSS.CSSMedia);
    reinitialize(payload: Protocol.CSS.CSSMedia): void;
    active(): boolean;
}
export declare const Source: {
    LINKED_SHEET: string;
    INLINE_SHEET: string;
    MEDIA_RULE: string;
    IMPORT_RULE: string;
};
