import portfinder from 'portfinder';

export const isPortInUse = async (port: number): Promise<boolean> => {
  portfinder.basePort = port;
  const freePort = await portfinder.getPortPromise();
  return freePort !== port;
};
