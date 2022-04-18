import os from 'os';
import ipaddr from 'ipaddr.js';
import defaultGateway from 'default-gateway';
import { GatewayFamily } from '@/@types/enum';

export const getAllLocalHostname = async () => {
  const hostV4 = await internalIP(GatewayFamily.V4);
  const hostV6 = await internalIP(GatewayFamily.V6);
  return [hostV4, hostV6, '127.0.0.1', 'localhost', '0.0.0.0', '::'];
};

export const internalIP = async (family: GatewayFamily) => {
  try {
    const { gateway } = await defaultGateway[family]();
    return findIp(gateway);
  } catch {
    // ignore
  }
};

export const internalIPSync = (family: GatewayFamily) => {
  try {
    const { gateway } = defaultGateway[family].sync();
    return findIp(gateway);
  } catch {
    // ignore
  }
};

function findIp(gateway: string) {
  const gatewayIp = ipaddr.parse(gateway);

  // Look for the matching interface in all local interfaces.
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const { cidr } of addresses) {
      const net = ipaddr.parseCIDR(cidr);

      if (net[0] && net[0].kind() === gatewayIp.kind() && gatewayIp.match(net)) {
        return net[0].toString();
      }
    }
  }
}
