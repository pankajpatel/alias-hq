const Path = require('path')
const fs = require('fs')

/**
 * Load a config file
 *
 * @param   {string}    path      The absolute path to the config file
 */
function loadConfig (path) {
  // file
  const json = require(path)

  // config
  const compilerOptions = json && json.compilerOptions
  if (compilerOptions && compilerOptions.paths) {
    config.rootUrl = Path.dirname(path)
    config.baseUrl = (compilerOptions.baseUrl || './')
    config.paths = compilerOptions.paths || {}
    return true
  }

  // normal file
  config.paths = {}
}

/**
 * Load config
 *
 * @param   {undefined}         value     Pass no value for to determine config file automatically
 * @param   {string}            value     Pass an absolute path to load from alternate location
 * @returns {object}                      The Alias HQ instance
 */
function load (value = undefined) {
  // variables
  let path

  // string: relative or absolute path passed
  if (typeof value === 'string') {
    path = Path.resolve(value)
    if (fs.existsSync(path)) {
      loadConfig(path)
    }
    else {
      throw new Error(`No such file "${path}"`)
    }
  }

  // no value: default config file
  else if (typeof value === 'undefined') {
    // variables
    let found = false
    const files = [
      'jsconfig.json',
      'tsconfig.base.json',
      'tsconfig.json',
    ]

    // attempt to load file
    while (files.length && !found) {
      let file = files.shift()
      path = Path.resolve('./', file)
      if (fs.existsSync(path)) {
        found = loadConfig(path)
      }
    }

    // could not load file!
    if (!found) {
      throw new Error('No config file found')
    }
  }

  // any other value
  else {
    throw new Error('Invalid parameter "value"')
  }

  // return
  return this
}

/**
 * Convert paths config using a plugin or callback
 *
 * @param   {string}    plugin    The name of an available plugin
 * @param   {function}  plugin    A custom function
 * @param   {object}   [options]  Any options to pass to the plugin
 */
function get (plugin, options = {}) {
  // load defaults if not loaded
  if (!config.paths) {
    load()
  }

  // callback
  if (typeof plugin === 'function') {
    return plugin(config, options)
  }

  // plugin
  if (typeof plugin === 'string') {
    // check for custom plugin
    if (typeof plugins.custom[plugin] === 'function') {
      const callback = plugins.custom[plugin]
      return callback(config, options)
    }

    // check for built-in plugin
    const path = Path.resolve(__dirname, `./plugins/${plugin}/index.js`)
    if (fs.existsSync(path)) {
      const callback = require(path)
      return callback(config, options)
    }
    throw new Error(`No such plugin "${plugin}"`)
  }

  // invalid
  throw new Error(`Invalid "plugin" parameter`)
}

/**
 * Convert and log paths config using a plugin or callback
 */
function json (plugin, options = {}, print = true) {
  let json = JSON.stringify(get(plugin, options), null, '  ')
  if (print) {
    console.log(json)
  }
  return json
}

const config = {
  rootUrl: '',
  baseUrl: '',
  paths: null,
}

const plugins = {
  custom: {},

  /**
   * Add a plugin to the core setup
   *
   * @param   {string}    name        The plugin name
   * @param   {function}  callback    The plugin function
   * @returns {object}                The Alias HQ instance
   */
  add (name, callback) {
    if (!this.custom[name] && typeof callback === 'function') {
      this.custom[name] = callback
    }
    return this
  },

  /**
   * List available plugin names
   *
   * @returns {string[]}
   */
  get names () {
    const path = Path.resolve(__dirname, 'plugins')
    const items = fs.readdirSync(path).map(file => file.replace('.js', ''))
    Object.keys(this.custom).forEach(key => {
      if (!items.includes(key)) {
        items.push(key)
      }
    })
    return items.sort()
  },
}

module.exports = {
  get,
  json,
  load,
  config,
  plugins,
}
