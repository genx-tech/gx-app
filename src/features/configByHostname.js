"use strict";

/**
 * Enable server specific config identified by host name.
 * @module Feature_ConfigByHostname
 */

const path = require('path');
const Feature = require('../enum/Feature');
const { runCmdSync, fs } = require('rk-utils');
const JsonConfigProvider = require('rk-config/lib/JsonConfigProvider');

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
            hostName = runCmdSync('hostname').trim();
        } catch (e) {
            app.log('warn', e.message || e);
        }

        if (hostName === '') {
            if (options.fallbackName) {
                hostName = options.fallbackName;
            } else {
                throw new Error('Unable to read "hostname" from environment.');
            }
        }         
        
        let hostSpecConfigFile = path.join(app.configPath, app.configName + '.' + hostName + '.json');
        if (!fs.existsSync(hostSpecConfigFile)) {
            app.log('warn', `Host specific config file "${hostSpecConfigFile}" does not exist and will use defaults.`);
            return;
        }

        app.configLoader.provider = new JsonConfigProvider(hostSpecConfigFile);
        return app.loadConfig_();
    }
};