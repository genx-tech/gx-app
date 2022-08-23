const {
  _,
  waitUntil_
} = require('@genx/july');

const Feature = require('../enum/Feature');

const {
  ensureFeatureName
} = require("../utils/Helpers");
/**
 * Enable a named soap client
 * @module Feature_SoapClient
 */


class SoapClient {
  constructor(app, config) {
    this.app = app;
    this.config = config;
    const soap = app.tryRequire('soap');
    soap.createClientAsync(config.wsdlUrl).then(client => {
      this._client = client;
    }).catch(error => {
      this.app.logError(error);
    });
  }

  async _waitForClientReady_() {
    if (this._client) return this._client;
    let createClientTimeout = this.config.createClientTimeout || 10000; // 10s

    let maxRound = createClientTimeout / 100;
    return waitUntil_(() => this._client, 100, maxRound);
  }

  async listMethods_() {
    let client = await this._waitForClientReady_();
    let desc = client.describe();

    let methods = _.mapValues(desc, svc => _.mapValues(svc, ms => Object.keys(ms)));

    return methods;
  }

  async call_(method, args) {
    let client = await this._waitForClientReady_();
    let [result, rawResponse, soapHeader, rawRequest] = await client[method + 'Async'](args);
    return result;
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
   * @param {object} settings - Settings of soal client   
   * @returns {Promise.<*>}
   */
  load_: async function (app, settings, name) {
    ensureFeatureName(name);
    let client = new SoapClient(app, settings);
    app.registerService(name, client);
  }
};
//# sourceMappingURL=soapClient.js.map