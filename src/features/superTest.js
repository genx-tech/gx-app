const { _ } = require("rk-utils");
const Feature = require("../enum/Feature");
const { tryRequire } = require("../utils/Helpers");
const { RestClient } = require('./restClient');
const URL = require('url');

/**
 * RESTful test client.
 * @class
 */
class RestTestClient extends RestClient {
    constructor(endpoint, onSend, onError, onSent) {
        super(endpoint, onSend, onError, onSent);   
        this.agent = tryRequire("supertest");     
    }

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
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of rest clients
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings) {
        _.map(settings, (endpoint, name) => {
            let client = new RestTestClient(endpoint);
            app.registerService(`superTest.${name}`, client);
        });
    },
};
