const Feature = require("../enum/Feature");
const { ensureFeatureName } = require("../utils/Helpers");

const { HttpClient } = require('./httpClient');

// backward compatible, use httpClient feature instead 

module.exports = {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    type: Feature.SERVICE,

    /**
     * This feature can be grouped by serviceGroup
     * @member {boolean}
     */
    groupable: true,

    RestClient: HttpClient,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of rest clients
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings, name) {
        ensureFeatureName(name);

        const agent = app.tryRequire("superagent").agent();

        let client = new HttpClient(agent, settings);

        app.registerService(name, client);        
    },
};
