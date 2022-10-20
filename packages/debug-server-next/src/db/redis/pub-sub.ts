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
 * ⚠️ publish and subscribe must behind connection, otherwise redis client will change to PubSub mode, could not send AUTH command
 */
import { Logger } from '@debug-server-next/utils/log';
import { IPublisher, ISubscriber } from '@debug-server-next/db/pub-sub';
import { RedisClient, RedisDB, listenRedisEvent } from './redis-db';

const log = new Logger('redis-pub-sub');

export class RedisPublisher implements IPublisher {
  private client: RedisClient;
  private channel: string;

  public constructor(channel: string) {
    if (!channel) {
      const e = new Error('channelId should not be empty');
      log.error('%s', e?.stack);
      throw e;
    }
    this.channel = channel;
    this.client = RedisDB.client.duplicate();
    listenRedisEvent(this.client);
  }

  public async publish(message: string | Adapter.CDP.Data) {
    await this.connect();
    const msgStr = typeof message !== 'string' ? JSON.stringify(message) : message;
    try {
      if (this.client.isOpen) await this.client.publish(this.channel, msgStr);
    } catch (e) {
      log.error('publish %s to channel %s error: %s', msgStr, this.channel, (e as Error).stack);
    }
  }

  /**
   * nullish, redis could send other command in PubSub mode
   */
  public async disconnect() {
    if (this.client.isOpen) await this.client.quit();
  }

  private async connect() {
    if (this.client.isOpen) return;
    await this.client.connect();
    log.verbose('redis publisher client created, %s', this.channel);
  }
}

export class RedisSubscriber implements ISubscriber {
  private client: RedisClient;
  private channel: string;

  public constructor(channel: string) {
    if (!channel) {
      const e = new Error('channelId should not be empty');
      log.error('%s', e?.stack);
      throw e;
    }
    this.channel = channel;
    this.client = RedisDB.client.duplicate();
    listenRedisEvent(this.client);
  }

  public async subscribe(cb) {
    await this.connect();
    if (this.client.isOpen) await this.client.subscribe(this.channel, cb);
  }

  /**
   * subscribe channel with glob character, such as `*`
   */
  public async pSubscribe(cb) {
    await this.connect();
    if (this.client.isOpen) await this.client.pSubscribe(this.channel, cb);
  }

  public async unsubscribe() {
    if (this.client.isOpen) await this.client.unsubscribe(this.channel);
  }

  public async pUnsubscribe() {
    if (this.client.isOpen) await this.client.pUnsubscribe(this.channel);
  }

  /**
   * nullish, redis could send other command in PubSub mode
   */
  public async disconnect() {
    if (this.client.isOpen) {
      // must unsubscribe first, other will receive error: `Cannot send commands in PubSub mode`
      await this.client.unsubscribe();
      await this.client.pUnsubscribe();
      try {
        await this.client.quit();
      } catch (e) {
        log.warn(`redis disconnect error %j`, e || (e as Error).stack);
      }
    }
  }

  private async connect() {
    if (this.client.isOpen) return;
    await this.client.connect();
    log.verbose('redis subscriber client created, %s', this.channel);
  }
}
