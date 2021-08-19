export declare class Progress {
    setTotalWork(totalWork: number): void;
    setTitle(title: string): void;
    setWorked(worked: number, title?: string): void;
    incrementWorked(worked?: number): void;
    done(): void;
    isCanceled(): boolean;
}
export declare class CompositeProgress {
    readonly parent: Progress;
    private readonly children;
    private childrenDone;
    constructor(parent: Progress);
    _childDone(): void;
    createSubProgress(weight?: number): SubProgress;
    _update(): void;
}
export declare class SubProgress implements Progress {
    private readonly composite;
    private weight;
    private worked;
    private totalWork;
    constructor(composite: CompositeProgress, weight?: number);
    isCanceled(): boolean;
    setTitle(title: string): void;
    done(): void;
    setTotalWork(totalWork: number): void;
    setWorked(worked: number, title?: string): void;
    incrementWorked(worked?: number): void;
    getWeight(): number;
    getWorked(): number;
    getTotalWork(): number;
}
export declare class ProgressProxy implements Progress {
    private readonly delegate;
    private readonly doneCallback;
    constructor(delegate?: Progress | null, doneCallback?: (() => void));
    isCanceled(): boolean;
    setTitle(title: string): void;
    done(): void;
    setTotalWork(totalWork: number): void;
    setWorked(worked: number, title?: string): void;
    incrementWorked(worked?: number): void;
}
