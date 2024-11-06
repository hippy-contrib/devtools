export const log: Log = new Proxy({}, {
  get: (target, method: string) => {
    if(!['log', 'warn', 'error', 'info'].includes(method)) return () => {};
    return (...args) => {
      console[method](
        '%c[devtools]%c',
        'color: yellow',
        'color: auto',
        ...args
      );
    }
  }
})

type Log = {
  [key: string]: typeof console.log
}