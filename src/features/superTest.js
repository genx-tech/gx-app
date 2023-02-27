const { URL } = require('node:url');

const { HttpClient } = require('./httpClient');
const Feature = require("../enum/Feature");
const { ensureFeatureName } = require("../utils/Helpers");

/**
 * Enable a named super rest client, for code coverage test only.
 * @module Feature_SuperTest
 */

/**
 * Http test client.
 * @class
 */
class HttpTestClient extends HttpClient {
    /**     
     * @param {*} agent 
     * @param {*} endpointOrOptions
     */
    constructor(agent, endpointOrOptions) {
        super(agent, endpointOrOptions); 
    }

    /**
     * Override the default initReq method of RestClient.
     * @param {*} httpMethod 
     * @param {*} url 
     */
    initReq(httpMethod, url) {
        const urlObj = new URL(url);

        const testUrl = urlObj.pathname;
        if (urlObj.hash) {
            testUrl += "#" + urlObj.hash;
        }

        if (!this.server) {
            throw new Error('"server" is required before sending test request.');
        }

        return this.agent(this.server)[httpMethod](testUrl);
    }
}

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

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of rest clients
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings, name) {
        ensureFeatureName(name);

        const agent = app.tryRequire("supertest");
        
        let client = new HttpTestClient(agent, settings);

        app.registerService(name, client);
    },
};
