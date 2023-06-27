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

import os from 'os';
import Aegis from '@debug-server-next/patch/aegis';
import BeaconAction from '@debug-server-next/patch/beacon';
import { config } from '@debug-server-next/config';
import { getBundleVersionId } from '@debug-server-next/utils/bundle-version';
import { OSType } from '@debug-server-next/@types/enum';
import { version } from '../../package.json';

class Report {
  public event = (event: Event) => {
    aegis.reportEvent(event);
    getBeacon().onDirectUserAction(event.name, event);
  };

  public error = (e: Error) => {
    aegis.report(e);
  };

  public log = (msg: string) => {
    aegis.infoAll(msg);
  };

  public time = (duration: number, event: Event) => {
    aegis.reportTime({
      duration,
      ...event,
    });
  };

  public timeStart = (name: string) => {
    const start = Date.now();
    return (event: Event = {}) => {
      const end = Date.now();
      const duration = end - start;
      aegis.reportTime({
        duration,
        ...event,
        name,
      });
    };
  };

  public addCommonParams = (params?: { [name: string]: any }) => {
    getBeacon().addAdditionalParams({
      ...params,
      userApp: global.debugAppArgv.env, // hippy or HippyTDF or TDFCore
      devtoolsPlatform: devtoolsPlatform(), // Darwin_x86 or Darwin_arm64 or Windows
      devtoolsEnv: config.isCluster ? 'remote' : 'local',
      hostname: os.hostname(),
    });
  };
}

export const report = new Report();

interface Event {
  name?: string;
  ext1?: string;
  ext2?: string;
  ext3?: string;
  [key: string]: string;
}

const aegis = new Aegis({
  id: config.aegisId,
  selector: {
    type: 'host',
  },
  uin: getBundleVersionId(),
  version,
  ext3: config.isCluster ? 'remote' : 'local',
  // protocol: 'http',
});

let beacon: BeaconAction;
const getBeacon = () => {
  if (!beacon) {
    beacon = new BeaconAction({
      appkey: '0WEB0A25405J1LFO',
      versionCode: version,
      openid: getBundleVersionId(),
      unionid: getBundleVersionId(),
    });
  }
  return beacon;
};

const devtoolsPlatform = () => {
  const osType = os.type();
  if (osType === OSType.Darwin) {
    if (process.arch === 'arm64') {
      return `${osType}_arm64`;
    }
    return `${osType}_x86`;
  }
  return osType;
};

export const createCDPPerformance = (perf?: Partial<Adapter.Performance>): Adapter.Performance => ({
  devtoolsToDebugServer: 0,
  debugServerReceiveFromDevtools: 0,
  debugServerToDevtools: 0,
  devtoolsReceive: 0,
  ...(perf || {}),
});
