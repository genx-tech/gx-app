"use strict";

/**
 * Enable server specific config identified by host name.
 * @module Feature_ConfigByHostname
 */

const { _ } = require('@genx/july');
const Feature = require('../enum/Feature');
const { requireConfig } = require('../utils/Helpers');

module.exports = {

    /**
     * This feature is loaded at configuration stage
     * @member {string}
     */
    type: Feature.CONF,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} config - Config for the feature
     * @property {string} [config.driver] - Data source driver
     * @property {string} [config.connectionString] - Connection string
     * @property {string} [config.entity] - Entity of the config
     * @property {string} [config.key] - Query key of the config
     * @returns {Promise.<*>}
     */
    load_: async (app, config) => {
        requireConfig(app, config, ['driver', 'connectionString', 'entity', 'key'], 'configFromDataSource');

        const { Connector } = app.tryRequire('@genx/data');        

        let connector = Connector.createConnector(config.driver, config.connectionString, { logger: app.logger || app.server.logger });
        
        try {
            let cfgData = await connector.findOne_(config.entity, config.key);

            if (cfgData) {
                app.config = _.defaults(cfgData, app.config);    
            } else {
                app.log('warn', `Feature "configFromDataSource" @ "${connector.getConnectionStringWithoutCredential()}" does not exist and this feature will be ignored.`);
            }           

        } finally {
            await connector.end_();
        }
    }
};