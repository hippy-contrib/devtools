/**
 * channel id 暂时未加 devtoolsId，所以当开启多个 chrome-devtools 时，下行消息是广播到所有
 * ws endpoint 的，体验上也不影响调试
 */
const downwardSpliter = '_down_';
const upwardSpliter = '_up_';
const internalSpliter = '_internal_';

export const createDownwardChannel = (clientId: string, extensionName?: string) =>
  createChannel(clientId, extensionName, downwardSpliter);

export const createUpwardChannel = (clientId: string, extensionName?: string) =>
  createChannel(clientId, extensionName, upwardSpliter);

export const createInternalChannel = (clientId: string, extensionName?: string) =>
  createChannel(clientId, extensionName, internalSpliter);

export const upwardChannelToDownwardChannel = (upwardChannelId: string) =>
  upwardChannelId.replace(upwardSpliter, downwardSpliter);

const createChannel = (clientId: string, extensionName?: string, spliter?: string) =>
  `${clientId}${spliter}${extensionName || 'default'}`;
