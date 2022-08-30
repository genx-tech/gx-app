"use strict";
/**
 * Enable developer specific config identified by git user name.
 * @module Feature_ConfigByGitUser
 */

const path = require('path');

const Feature = require('../enum/Feature');

const {
  fs,
  cmd
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
   * @property {string} [options.fallbackName] - Fallback username for git user not available
   * @returns {Promise.<*>}
   */
  load_: async (app, options) => {
    let devName;

    try {
      devName = cmd.runSync('git config --global user.email').trim();
    } catch (e) {
      app.log('warn', e.message || e);
    }

    if (!devName || devName === '') {
      if (options.fallbackName) {
        devName = options.fallbackName;
      } else {
        app.log('warn', 'Unable to read "user.email" of git config and no fallback option is configured.');
        return;
      }
    }

    devName = devName.substr(0, devName.indexOf('@'));
    const devConfigFile = path.join(app.configPath, app.configName + '.' + devName + '.json');

    if (!fs.existsSync(devConfigFile)) {
      app.log('warn', `Developer specific config file "${devConfigFile}" does not exist and will use defaults.`);
      return;
    }

    app.configLoader.provider = new JsonConfigProvider(devConfigFile);
    return app.loadConfig_();
  }
};
//# sourceMappingURL=configByGitUser.js.map