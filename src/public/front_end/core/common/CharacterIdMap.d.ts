export declare class CharacterIdMap<T> {
    private readonly elementToCharacter;
    private readonly characterToElement;
    private charCode;
    constructor();
    toChar(object: T): string;
    fromChar(character: string): T | null;
}
