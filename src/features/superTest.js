const { _ } = require("@genx/july");
const URL = require('url');

const { RestClient } = require('./restClient');
const Feature = require("../enum/Feature");
const { ensureFeatureName } = require("../utils/Helpers");

/**
 * Enable a named super rest client, for code coverage test only.
 * @module Feature_SuperTest
 */

/**
 * RESTful test client.
 * @class
 */
class RestTestClient extends RestClient {
    /**     
     * @param {*} endpoint 
     * @param {*} onSend 
     * @param {*} onError 
     * @param {*} onSent 
     */
    constructor(app, endpoint, onSend, onError, onSent) {
        super(endpoint, onSend, onError, onSent);   
        this.agent = app.tryRequire("supertest");     
    }

    /**
     * Override the default initReq method of RestClient.
     * @param {*} httpMethod 
     * @param {*} url 
     */
    initReq(httpMethod, url) {
        const urlObj = URL.parse(url);

        const testUrl = urlObj.path;
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
        
        let client = new RestTestClient(app, settings);

        app.registerService(name, client);
    },
};
