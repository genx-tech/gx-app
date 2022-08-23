"use strict";
/**
 * Enable server specific config identified by host name.
 * @module Feature_ConfigByHostname
 */

const path = require('path');

const Feature = require('../enum/Feature');

const {
  cmd,
  fs
} = require('@genx/sys');

const JsonConfigProvider = require('@genx/config/lib/JsonConfigProvider');

module.exports = {
  /**
   * This feature is loaded at configuration stage
   * @member {string}
   */
  type: Feature.CONF,

  /**
   * Load the feature
   * @param {App} app - The cli app module object
   * @param {object} options - Options for the feature
   * @property {string} [options.fallbackName] - Fallback name if hostname not available
   * @returns {Promise.<*>}
   */
  load_: async (app, options) => {
    let hostName;

    try {
      hostName = cmd.runSync('hostname').trim();
    } catch (e) {
      app.log('warn', e.message || e);
    }

    if (!hostName) {
      throw new Error('Unable to read "hostname" from environment.');
    }

    let hostSpecConfigFile = path.join(app.configPath, app.configName + '.' + hostName + '.json');

    if (!fs.existsSync(hostSpecConfigFile)) {
      if (options.fallbackName) {
        hostName = options.fallbackName;
        let hostSpecConfigFileFb = path.join(app.configPath, app.configName + '.' + hostName + '.json');

        if (!fs.existsSync(hostSpecConfigFileFb)) {
          throw new Error(`The specific config file for host [${hostName}] not found and the fallback config [${hostSpecConfigFileFb}] not found either.`);
        }

        hostSpecConfigFile = hostSpecConfigFileFb;
      } else {
        app.log('warn', `The specific config file for host [${hostName}] not found and no fallback setting. Use defaults.`);
        return;
      }
    }

    app.configLoader.provider = new JsonConfigProvider(hostSpecConfigFile);
    return app.loadConfig_();
  }
};
//# sourceMappingURL=configByHostname.js.map