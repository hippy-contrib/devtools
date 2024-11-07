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

import { connectToDevTools } from './hippy';
import { parseURL, getWSProtocolByHttpProtocol, makeUrl } from './utils/url';

// __resourceQuery is entry query string, webpack will inject this variable
const parsedResourceQuery = parseURL(__resourceQuery)
const protocol = getWSProtocolByHttpProtocol(parsedResourceQuery.protocol || 'http')
const host = parsedResourceQuery.host || 'localhost'
const port = parsedResourceQuery.port || 38989
let clientId
try {
  clientId = global.__HIPPYNATIVEGLOBAL__.Debug.debugClientId
} catch (e) {
  console.warn('get react devtools clientId failed, please update hippy sdk to ^2.13.4')
}

const path = makeUrl(`/debugger-proxy`, {
  role: 'react_js_runtime',
  contextName: 'contextName',
  clientId,
})

setTimeout(() => {
  global.connectToDevTools = () => {
    connectToDevTools({
      protocol,
      host,
      port,
      path,
    });
  }
  global.connectToDevTools();
}, 1000);
