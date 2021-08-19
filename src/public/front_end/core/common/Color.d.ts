export declare class Color {
    private hslaInternal;
    private rgbaInternal;
    private originalText;
    private readonly originalTextIsValid;
    private formatInternal;
    constructor(rgba: number[], format: Format, originalText?: string);
    static parse(text: string): Color | null;
    static fromRGBA(rgba: number[]): Color;
    static fromHSVA(hsva: number[]): Color;
    static _parsePercentOrNumber(value: string): number | null;
    static _parseRgbNumeric(value: string): number | null;
    static _parseHueNumeric(value: string): number | null;
    static _parseSatLightNumeric(value: string): number | null;
    static _parseAlphaNumeric(value: string): number | null;
    static _hsva2hsla(hsva: number[], out_hsla: number[]): void;
    static hsl2rgb(hsl: number[], out_rgb: number[]): void;
    static hsva2rgba(hsva: number[], out_rgba: number[]): void;
    /**
     * Compute a desired luminance given a given luminance and a desired contrast
     * ratio.
     */
    static desiredLuminance(luminance: number, contrast: number, lighter: boolean): number;
    /**
     * Approach a value of the given component of `candidateHSVA` such that the
     * calculated luminance of `candidateHSVA` approximates `desiredLuminance`.
     */
    static approachColorValue(candidateHSVA: number[], bgRGBA: number[], index: number, desiredLuminance: number, candidateLuminance: (arg0: Array<number>) => number): number | null;
    static findFgColorForContrast(fgColor: Color, bgColor: Color, requiredContrast: number): Color | null;
    static findFgColorForContrastAPCA(fgColor: Color, bgColor: Color, requiredContrast: number): Color | null;
    format(): Format;
    /** HSLA with components within [0..1]
       */
    hsla(): number[];
    canonicalHSLA(): number[];
    /** HSVA with components within [0..1]
       */
    hsva(): number[];
    hasAlpha(): boolean;
    detectHEXFormat(): Format;
    asString(format?: string | null): string | null;
    rgba(): number[];
    canonicalRGBA(): number[];
    /** nickname
       */
    nickname(): string | null;
    toProtocolRGBA(): {
        r: number;
        g: number;
        b: number;
        a: (number | undefined);
    };
    invert(): Color;
    setAlpha(alpha: number): Color;
    blendWith(fgColor: Color): Color;
    blendWithAlpha(alpha: number): Color;
    setFormat(format: Format): void;
}
export declare const Regex: RegExp;
export declare enum Format {
    Original = "original",
    Nickname = "nickname",
    HEX = "hex",
    ShortHEX = "shorthex",
    HEXA = "hexa",
    ShortHEXA = "shorthexa",
    RGB = "rgb",
    RGBA = "rgba",
    HSL = "hsl",
    HSLA = "hsla"
}
export declare const Nicknames: Map<string, number[]>;
export declare const PageHighlight: {
    Content: Color;
    ContentLight: Color;
    ContentOutline: Color;
    Padding: Color;
    PaddingLight: Color;
    Border: Color;
    BorderLight: Color;
    Margin: Color;
    MarginLight: Color;
    EventTarget: Color;
    Shape: Color;
    ShapeMargin: Color;
    CssGrid: Color;
    LayoutLine: Color;
    GridBorder: Color;
    GapBackground: Color;
    GapHatch: Color;
    GridAreaBorder: Color;
};
export declare const SourceOrderHighlight: {
    ParentOutline: Color;
    ChildOutline: Color;
};
export declare class Generator {
    private readonly hueSpace;
    private readonly satSpace;
    private readonly lightnessSpace;
    private readonly alphaSpace;
    private readonly colors;
    constructor(hueSpace?: number | {
        min: number;
        max: number;
        count: (number | undefined);
    }, satSpace?: number | {
        min: number;
        max: number;
        count: (number | undefined);
    }, lightnessSpace?: number | {
        min: number;
        max: number;
        count: (number | undefined);
    }, alphaSpace?: number | {
        min: number;
        max: number;
        count: (number | undefined);
    });
    setColorForID(id: string, color: string): void;
    colorForID(id: string): string;
    _generateColorForID(id: string): string;
    _indexToValueInSpace(index: number, space: number | {
        min: number;
        max: number;
        count: (number | undefined);
    }): number;
}
