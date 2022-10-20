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

import { AppClientType, DeviceStatus, ReportEvent } from '@debug-server-next/@types/enum';
import { DeviceInfo } from '@debug-server-next/@types/device';
import { TunnelLogger } from '@debug-server-next/utils/log';
import { getDBOperator } from '@debug-server-next/db';
import { createTargetByDeviceInfo, patchDebugTarget } from '@debug-server-next/utils/debug-target';
import { config } from '@debug-server-next/config';
import { appClientManager } from '@debug-server-next/client/app-client-manager';
import { cleanDebugTarget, subscribeCommand } from '@debug-server-next/controller/pub-sub-manager';
import { report } from '@debug-server-next/utils/report';

const log = new TunnelLogger('device-manager');

class DeviceManager {
  private deviceList: DeviceInfo[] = [];

  /**
   * app disconnection, clean debugTarget
   */
  public onAppDisconnect() {
    const device = this.deviceList[0];
    if (!device) return;
    // 通过 tunnel 通道创建的 debugTarget 的 clientId 为 devicename
    cleanDebugTarget(device.devicename, false);
  }

  /**
   * app connection, add debugTarget and subscribe upward protocol
   */
  public async onAppConnect() {
    log.verbose('app connect, %j', this.deviceList);
    const device = this.deviceList[0];
    if (!device) return log.warn('no device connect!');

    const useTunnel = appClientManager.shouldUseAppClientType(device.platform, AppClientType.Tunnel);
    log.verbose('useTunnel %j, is connected %j', useTunnel, device.physicalstatus === DeviceStatus.Connected);
    if (device.physicalstatus === DeviceStatus.Connected && useTunnel) {
      try {
        let debugTarget = createTargetByDeviceInfo(device);
        debugTarget = await patchDebugTarget(debugTarget);
        const { DB } = getDBOperator();
        log.verbose('before upsert db %j', debugTarget);
        new DB(config.redis.debugTargetTable).upsert(debugTarget.clientId, debugTarget);
        subscribeCommand(debugTarget);
        report.event({
          name: ReportEvent.RemoteDebug,
          ext1: debugTarget.title,
          ext2: debugTarget.platform,
        });
      } catch (e) {
        log.error('app connect e, %j, %j', (e as any)?.stack, e);
      }
    }
  }

  public async getDeviceList() {
    global.addon.getDeviceList((devices: DeviceInfo[]) => {
      log.verbose('getDeviceList: %j', devices);
      this.deviceList = devices;
      if (devices.length) {
        const isDeviceDisconnect = devices[0].physicalstatus === DeviceStatus.Disconnected;
        if (isDeviceDisconnect) return;

        // TODO tunnel doesn't support multiple device, so just select the first one
        const device = this.deviceList[0];
        const deviceId = device.deviceid;
        log.verbose(`selectDevice ${deviceId}`);
        global.addon.selectDevice(deviceId);
      }
    });
  }
}

export const deviceManager = new DeviceManager();
