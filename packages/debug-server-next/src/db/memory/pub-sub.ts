/*
 * Tencent is pleased to support the open source community by making
 * Hippy available.
 *
 * Copyright (C) 2017-2019 THL A29 Limited, a Tencent company.
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * use eventemitter3 implement Pub/Sub, support redis glob character, such as `*`
 */
import { EventEmitter } from '@debug-server-next/utils/event-emitter';
import { IPublisher, ISubscriber } from '@debug-server-next/db/pub-sub';

const pubsub = new EventEmitter();

export class MemoryPubSub implements IPublisher, ISubscriber {
  private channel: string;
  private subscribeHandler: Function;

  public constructor(channel: string) {
    this.channel = channel;
  }

  public async connect() {}

  public async publish(message: string | Adapter.CDP.Req) {
    let msgStr: string;
    if (typeof message !== 'string') msgStr = JSON.stringify(message);
    else msgStr = message;
    pubsub.emit(this.channel, msgStr, null, null, null, null);
  }

  public async subscribe(cb) {
    this.subscribeHandler = cb;
    pubsub.on(this.channel, cb);
  }

  /**
   * subscribe channel with glob character, such as `*`
   */
  public async pSubscribe(cb) {
    this.subscribeHandler = cb;
    pubsub.on(this.channel, cb);
  }

  public async unsubscribe(cb?) {
    const handler = cb || this.subscribeHandler;
    if (handler) pubsub.off(this.channel, handler);
    else pubsub.removeAllListeners(this.channel);
  }

  public async pUnsubscribe(cb?) {
    const handler = cb || this.subscribeHandler;
    if (handler) pubsub.off(this.channel, handler);
    else pubsub.removeAllListeners(this.channel);
  }

  public async disconnect() {
    // auto unsubscribe for Subscriber
    if (this.subscribeHandler) this.unsubscribe(this.subscribeHandler);
    if (this.subscribeHandler) this.pUnsubscribe(this.subscribeHandler);
  }
}
