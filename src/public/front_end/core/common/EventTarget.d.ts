import type * as Platform from '../platform/platform.js';
export interface EventDescriptor<Events = any, T extends EventType<Events> = any> {
    eventTarget: EventTarget<Events>;
    eventType: T;
    thisObject?: Object;
    listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void;
}
export declare function removeEventListeners(eventList: EventDescriptor[]): void;
export declare type EventType<Events> = Events extends Object ? keyof Events : Events extends void ? never : string | symbol;
export declare type EventPayload<Events, T> = T extends keyof Events ? Events[T] : unknown;
export declare type EventPayloadToRestParameters<T> = T extends void ? [] : [T];
export interface EventTarget<Events = any> {
    addEventListener<T extends EventType<Events>>(eventType: T, listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void, thisObject?: Object): EventDescriptor<Events, T>;
    once<T extends EventType<Events>>(eventType: T): Promise<EventPayload<Events, T>>;
    removeEventListener<T extends EventType<Events>>(eventType: T, listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void, thisObject?: Object): void;
    hasEventListeners(eventType: EventType<Events>): boolean;
    dispatchEventToListeners<T extends EventType<Events>>(eventType: Platform.TypeScriptUtilities.NoUnion<T>, ...[eventData]: EventPayloadToRestParameters<EventPayload<Events, T>>): void;
}
export declare function fireEvent(name: string, detail?: unknown, target?: HTMLElement | Window): void;
export interface EventTargetEvent<T = any> {
    data: T;
}
