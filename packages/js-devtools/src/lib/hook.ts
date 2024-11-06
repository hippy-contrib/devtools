export const hookClass = (Ctor, options: ClassHookOptions) => {
  Object.entries(Object.getOwnPropertyDescriptors(Ctor.prototype)).forEach(([prop, descriptor]) => {
    const hooks = options[prop];
    if(!hooks || prop === 'constructor') return;

    if(descriptor.set) {
      Ctor.prototype['_' + prop] = Ctor.prototype[prop];
      Object.defineProperty(Ctor.prototype, prop, {
        ...descriptor,
        set: function(args) {
          let newArgs = args
          this.inSetter = true;
          if(hooks?.argsBefore) newArgs = hooks.argsBefore.apply(this, [args]) as any
          if(hooks?.before) hooks.before.apply(this, [args]);
          const result = descriptor.set.apply(this, [newArgs]);
          if(hooks?.after) hooks.after.apply(this, [args].concat(result));
          return result;
        }
      })
      return;
    }

    Ctor.prototype['_' + prop] = Ctor.prototype[prop];
  
    Ctor.prototype[prop] = function(...args) {
      let result
      if(hooks?.before) hooks.before.apply(this, args);
      if(hooks?.current) result = hooks.current.apply(this, args);
      else result = this['_' + prop](...args);
      if(hooks?.after) hooks.after.apply(this, args.concat(result))
      return result;
    };
  });
}

export const hookFunction = (obj, key, {before, after, error, isAsync = false}: FunctionHookOptions) => {
  if(!obj[key]) return;
  
  if(isAsync) {
    obj[key] = new Proxy(obj[key], {
      apply: async (target, thisArg, args) => {
        const ctx = {};
        if(before) before.apply(thisArg, [ctx].concat(args));
        let rst;
        try {
          rst = await target.apply(thisArg, args);
        } catch(e) {
          if(error) error.apply(thisArg, [ctx, e].concat(args));
          throw e;
        }
        if(after) after.apply(thisArg, [ctx, rst].concat(args));
        return rst;
      }
    })
    return;  
  }

  obj[key] = new Proxy(obj[key], {
    apply: (target, thisArg, args) => {
      const ctx = {};
      if(before) before.apply(thisArg, [ctx].concat(args));
      const rst = target.apply(thisArg, args);
      if(after) after.apply(thisArg, [ctx, rst].concat(args));
      return rst;
    }
  })
}

interface ClassHookOptions {
  [key: string]: {
    before?: Hook,
    current?: Hook,
    after?: Hook,
    argsBefore?: Hook,
    argsAfter?: Hook,
  }
}

type Hook = (this: any, ...args: any[]) => void

interface FunctionHookOptions {
  before?: Hook,
  after?: Hook,
  isAsync?: boolean,
  // hook promise error callback
  error?: Hook,
}