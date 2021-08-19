import type * as Platform from '../platform/platform.js';
import type { EventDescriptor, EventTarget, EventTargetEvent, EventType, EventPayload, EventPayloadToRestParameters } from './EventTarget.js';
interface ListenerCallbackTuple {
    thisObject?: Object;
    listener: (arg0: EventTargetEvent) => void;
    disposed?: boolean;
}
export declare class ObjectWrapper<Events = any> implements EventTarget<Events> {
    listeners?: Map<EventType<Events>, Set<ListenerCallbackTuple>>;
    addEventListener<T extends EventType<Events>>(eventType: T, listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void, thisObject?: Object): EventDescriptor<Events, T>;
    once<T extends EventType<Events>>(eventType: T): Promise<EventPayload<Events, T>>;
    removeEventListener<T extends EventType<Events>>(eventType: T, listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void, thisObject?: Object): void;
    hasEventListeners(eventType: EventType<Events>): boolean;
    dispatchEventToListeners<T extends EventType<Events>>(eventType: Platform.TypeScriptUtilities.NoUnion<T>, ...[eventData]: EventPayloadToRestParameters<EventPayload<Events, T>>): void;
}
export {};
