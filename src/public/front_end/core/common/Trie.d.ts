export declare class Trie {
    private size;
    private root;
    private edges;
    private isWord;
    private wordsInSubtree;
    private freeNodes;
    constructor();
    add(word: string): void;
    remove(word: string): boolean;
    has(word: string): boolean;
    words(prefix?: string): string[];
    private dfs;
    longestPrefix(word: string, fullWordOnly: boolean): string;
    clear(): void;
}
