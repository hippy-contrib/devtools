export declare type FinishCallback = (err: Error) => void;
export declare class Throttler {
    private readonly timeout;
    private isRunningProcess;
    private asSoonAsPossible;
    private process;
    private lastCompleteTime;
    private schedulePromise;
    private scheduleResolve;
    private processTimeout?;
    constructor(timeout: number);
    _processCompleted(): void;
    _processCompletedForTests(): void;
    _onTimeout(): void;
    schedule(process: () => (Promise<unknown>), asSoonAsPossible?: boolean): Promise<void>;
    _innerSchedule(forceTimerUpdate: boolean): void;
    _clearTimeout(timeoutId: number): void;
    _setTimeout(operation: () => void, timeout: number): number;
    _getTime(): number;
}
