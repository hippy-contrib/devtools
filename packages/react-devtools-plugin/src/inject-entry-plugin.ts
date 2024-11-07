import { validate } from 'schema-utils'
import webpack from 'webpack'
import type { Compiler, Configuration, Entry, EntryFunc } from 'webpack'
import { Schema } from 'schema-utils/declarations/ValidationError'

export interface InjectEntryPluginConfig {
  /**
   * The name of the [webpack entry](https://webpack.js.org/concepts/entry-points/).
   * by default inject to every entry if not set this field
   */
  entry?: string
  /**
   * The filepath to the source code to prepend.
   */
  prepends?: string[]
  /**
   * The filepath to the source code to append.
   */
  appends?: string[]
}

const schema: Schema = {
  type: 'object',
  properties: {
    entry: {
      type: 'string',
      optional: true,
    },
    prepends: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    appends: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
}

function injectEntryWebpack5(
  compiler: Compiler,
  entryName?: string,
  prepends: string[] = [],
  appends: string[] = [],
): void {
  const { options } = compiler;

  /**
   * EntryPlugin will prepend entry to the head of entry list
   * When use EntryPlugin muti-times, will follow FIFO sequence like queue
   * so use EntryPlugin can ensure more stable of entry sequence
   */
  const EntryPlugin = (webpack as any).EntryPlugin;
  if (EntryPlugin) {
    // Prepended entries does not care about injection order,
    prepends.forEach((entry) => {
      new EntryPlugin(compiler.context, entry, { name: undefined }).apply(compiler as any);
    });
    prepends = [];
  }

  const entry: any = typeof options.entry === 'function' ? options.entry() : Promise.resolve(options.entry);

  options.entry = () =>
    entry.then((entryObj: any) => {
      function injectOneEntry(entryName: string) {
        const injectEntry: typeof entryObj[string] | undefined = entryObj[entryName];
        if (!injectEntry?.import) {
          throw new Error(
            `Could not find an entry named '${entryName}'. See https://webpack.js.org/concepts/entry-points/ for an overview of webpack entries.`,
          );
        }
        prepends.forEach((prepend) => {
          if (!injectEntry.import.includes(prepend)) injectEntry.import.unshift(prepend);
        });
        appends.forEach((append) => {
          if (!injectEntry.import.includes(append)) injectEntry.import.push(append);
        });
        return entryObj;
      }

      if (entryName) {
        injectOneEntry(entryName);
      } else {
        Object.keys(entryObj).forEach((entryName) => {
          injectOneEntry(entryName);
        });
      }
      return entryObj;
    });
}

function injectEntryWebpack4(
  compiler: Compiler,
  entryName?: string,
  prepends: string[] = [],
  appends: string[] = [],
): void {
  const { options } = compiler;
  function injectEntry(entry: Exclude<Configuration['entry'], EntryFunc>): string[] | Entry {
    switch (typeof entry) {
      case 'undefined': {
        throw new Error(
          `Could not find an entry named '${entryName}'. See https://webpack.js.org/concepts/entry-points/ for an overview of webpack entries.`,
        );
      }
      case 'string': {
        return [...prepends, entry, ...appends];
      }
      case 'object': {
        if (Array.isArray(entry)) {
          prepends.forEach((file) => {
            if (!entry.includes(file)) entry.unshift(file);
          });
          appends.forEach((file) => {
            if (!entry.includes(file)) entry.push(file);
          });
          return entry;
        }
        if (entryName) {
          return {
            ...entry,
            [entryName]: injectEntry(entry[entryName]) as unknown as string[],
          };
        }
        Object.keys(entry).forEach((key) => {
          entry[key] = injectEntry(entry[key]) as unknown as string[];
        });
        return entry;
      }
      default: {
        const _exhaust: never = entry;
        return _exhaust;
      }
    }
  }

  const { entry } = options;
  typeof entry === 'function'
    ? (options.entry = () => Promise.resolve(entry()).then(injectEntry))
    : (options.entry = () => injectEntry(entry));
}

export default class InjectEntryPlugin {
  config: InjectEntryPluginConfig;

  constructor(options: InjectEntryPluginConfig) {
    validate(schema, options, {
      name: 'Inject Entry Webpack Plugin',
      baseDataPath: 'options',
    })
    this.config = options
  }

  apply(compiler: Compiler): void {
    const { entry, prepends, appends } = this.config
    if (!webpack.version || webpack.version.startsWith('4')) {
      injectEntryWebpack4(compiler, entry, prepends, appends)
    } else {
      injectEntryWebpack5(compiler, entry, prepends, appends)
    }
  }
}
