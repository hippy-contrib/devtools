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

export const enum DevtoolsEnv {
  // include hippy 2.x, hippy 3.x (voltron, native)
  Hippy = 'hippy',
  TDFCore = 'TDFCore',
  HippyTDF = 'HippyTDF',
}

export enum DebugTunnel {
  TCP = 'TCP',
  WS = 'WS',
}

export enum DevicePlatform {
  Unknown = '0',
  IOS = '1',
  Android = '2',
}

export const enum DeviceStatus {
  Connected = '1',
  Disconnected = '2',
}

export const enum TunnelEvent {
  AddDevice = 'tunnel_add_device',
  RemoveDevice = 'tunnel_remove_device',
  AppConnect = 'tunnel_app_connect',
  AppDisconnect = 'tunnel_app_disconnect',
  ReceiveData = 'tunnel_recv_data',
  TunnelLog = 'tunnel_log',
}

export const enum DebuggerProtocolType {
  Unknown,
  CDP,
  DAP,
}

export enum ClientType {
  App = 'app',
  Devtools = 'devtools',
  Unknown = 'unknown',
}

export enum ClientRole {
  Android = 'android_client',
  Devtools = 'devtools',
  IOS = 'ios_client',
  HMRClient = 'hmr_client',
  HMRServer = 'hmr_server',
  // vue devtools
  JSRuntime = 'js_runtime',
  // vanilla js devtools
  VanillaJSRuntime = 'vanilla_js_runtime',
  // react devtools
  ReactJSRuntime = 'react_js_runtime',
  // frontend vue devtools tab
  VueDevtools = 'vue_devtools',
  ReactDevtools = 'react_devtools',
}

export const enum AppClientEvent {
  Message = 'message',
  Close = 'close',
}

export const enum AppClientType {
  Tunnel = 'TunnelAppClient',
  WS = 'WSAppClient',
  IWDP = 'IWDPAppClient',
}

/**
 * flame chart frame type
 */
export enum PH {
  Begin = 'B',
  End = 'E',
  MetaData = 'M',
  Complete = 'X',
}

export enum DeviceManagerEvent {
  AddDevice = 'addDevice',
  RemoveDevice = 'removeDevice',
  AppDidDisConnect = 'appDidDisConnect',
  AppDidConnect = 'appDidConnect',
  GetDeviceList = 'getDeviceList',
}

export enum ChromePageType {
  Page = 'page',
  Node = 'node',
}

export const enum ErrorCode {
  DomainFiltered = 1,
  NoAppClient = 2,
  EmptyCommand = 3,
}

export const enum ProtocolErrorCode {
  ProtocolNotFound = -32601,
}

export enum MiddlewareType {
  Upward = 'upward',
  Downward = 'downward',
}

export enum DBType {
  Redis = 'redis',
  Memory = 'memory',
}

export enum WinstonColor {
  BgRed = 'bgRed',
  Black = 'black',
  Red = 'red',
  Green = 'green',
  Yellow = 'yellow',
  Blue = 'blue',
  Magenta = 'magenta',
  Cyan = 'cyan',
  White = 'white',
  Gray = 'gray',
  Grey = 'grey',
  BrightRed = 'brightRed',
  BrightGreen = 'brightGreen',
  BrightYellow = 'brightYellow',
  BrightBlue = 'brightBlue',
  BrightMagenta = 'brightMagenta',
  BrightCyan = 'brightCyan',
  BrightWhite = 'brightWhite',
}

export enum InternalChannelEvent {
  AppWSClose = 'AppWSClose',
  DevtoolsConnected = 'DevtoolsConnected',
}

export enum ChromeLogLevel {
  Info = 'info',
  Error = 'error',
  Verbose = 'verbose',
  Warning = 'warning',
}

export enum OSType {
  Darwin = 'Darwin',
  Linux = 'Linux',
  Windows = 'Windows_NT',
}

export enum HMREvent {
  Hot = 'hot',
  LiveReload = 'liveReload',
  Invalid = 'invalid',
  Hash = 'hash',
  Logging = 'logging',
  Overlay = 'overlay',
  Reconnect = 'reconnect',
  Progress = 'progress',
  Ok = 'ok',
  Warnings = 'warnings',
  Errors = 'errors',
  Error = 'error',
  Close = 'close',
  ProgressUpdate = 'progress-update',
  StillOk = 'still-ok',
  ContentChanged = 'content-changed',
  StaticChanged = 'static-changed',
  TransferFile = 'transfer-file',
}

export enum WSCode {
  // close without close frame, such as app is killed, or adb disconnected
  CloseAbnormal = 1006,
  InvalidRequestParams = 4000,
  HMRServerClosed = 4001,
  NoDebugTarget = 4002,
  ClosePage = 4003,
  ReloadPage = 4004,
  AppClientDestroyed = 4005,
}

export enum StaticFileStorage {
  Local = 'local',
  COS = 'COS',
}

export enum ReportEvent {
  StartDev = 'start-dev', // event for npm run hippy:dev
  RemoteDebug = 'remote-debug', // event for device connection
  DisRemoteDebug = 'dis-remote-debug', // event for device disconnection
  ConnectFrontend = 'connect-frontend', // event for connect frontend and debug
  ConnectFrontend2 = 'connect-frontend2', // event for frontend connection after evaluate isVue command
  DisConnectFrontend = 'disconnect-frontend', // event for disconnect frontend and debug
  UpdateContext = 'update-context', // event for context name update
  HMR = 'hmr', // event for use hmr
  COSUpload = 'cos-upload',
  RemoteHMR = 'remote-hmr',
  VueDevtools = 'vue-devtools',
  ReactDevtools = 'react-devtools',
  VanillaJSRuntime = 'vanilla_js_runtime', // event for use vanilla like cookie, storage...
  VanillaIOSJSRuntime = 'vanilla_ios_js_runtime', // event for use vanilla like ios console
  DevtoolsToDebugServer = 'devtools-to-debug-server',
  DebugServerToDevtools = 'debug-server-to-devtools',
  PubSub = 'pub-sub',
  RedisConnection = 'redis-connection',
  RedisError = 'redis-error',
  CDPTotal = 'CDP-total',
  HMRPCToServer = 'HMR-PC-to-server',
  HMRServerToApp = 'HMR-server-to-app',
  HMRTotal = 'HMR-total',
}

export const enum ReportExt3 {
  Remote = 'remote',
  Local = 'local',
}

export enum HMRReportExt2 {
  Server = 'server',
  Client = 'client',
}

export enum HMRSyncType {
  FirstTime = 'first-time',
  Patch = 'patch',
}

export enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Http = 'http',
  Verbose = 'verbose',
  Debug = 'debug',
  Silly = 'silly',
}

export enum GatewayFamily {
  V4 = 'v4',
  V6 = 'v6',
}

export enum AppDriverType {
  React = 'React',
  Vue = 'Vue',
  Other = 'Other',
}
