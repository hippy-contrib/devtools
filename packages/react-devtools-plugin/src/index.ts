import InjectEntryPlugin from './inject-entry-plugin'
import { validate } from 'schema-utils'
import type { Compiler } from 'webpack'
import { Schema } from 'schema-utils/declarations/ValidationError'
import path from 'path'

export interface InjectReactDevtoolsEntryPluginConfig {
  host: string
  port: number
  protocol: 'http' | 'https'
}

const schema: Schema = {
  type: 'object',
  properties: {
    protocol: {
      enum: ['http', 'https'],
    },
    host: {
      type: 'string',
      minLength: 1,
      description: 'Remote debug host.',
    },
    port: {
      anyOf: [
        {
          type: 'number',
          minimum: 0,
          maximum: 65535,
        },
        {
          type: 'string',
          minLength: 1,
        },
      ],
      description: 'Remote debug server port.',
    },
    additionalProperties: false,
  },
}

export class InjectReactDevtoolsPlugin {
  private options: InjectReactDevtoolsEntryPluginConfig;
  private injectEntryPlugin: InjectEntryPlugin
  constructor(options: InjectReactDevtoolsEntryPluginConfig) {
    validate(schema, options, {
      name: 'Inject React Devtools Entry Webpack Plugin',
      baseDataPath: 'options',
    })
    this.options = options
    this.injectEntryPlugin = new InjectEntryPlugin({
      prepends: [makeUrl(path.join(__dirname, 'backend.js'), this.options)],
      appends: [],
    })
  }

  apply(compiler: Compiler) {
    compiler.hooks.environment.tap(InjectReactDevtoolsPlugin.name, (compilation) => {
      this.injectEntryPlugin.apply(compiler)
    })
  }
}

const makeUrl = (baseUrl: string, query: unknown = {}) => {
  let fullUrl = baseUrl

  const keys = Object.keys(query)
  for (const [i, key] of keys.entries()) {
    if (i === 0) {
      if (fullUrl.indexOf('?') === -1) {
        fullUrl += '?'
      }
    } else {
      fullUrl += '&'
    }
    fullUrl += `${key}=${encodeURIComponent(query[key])}`
  }
  return fullUrl
}
