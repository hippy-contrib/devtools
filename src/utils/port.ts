import portfinder from 'portfinder';

export const isPortInUse = async (port: number): Promise<boolean> => {
  portfinder.basePort = port;
  const freePort = await portfinder.getPortPromise();
  return freePort !== port;
};

export const checkPort = async () => {
  const { port } = global.debugAppArgv;
  const inUse = await isPortInUse(port);
  if (inUse) {
    console.error('EADDRINUSE: port %d is in use!', port);
    process.exit(1);
  }
};
