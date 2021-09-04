"use strict";

require("source-map-support/register");

const {
  _
} = require("@genx/july");

const URL = require('url');

const {
  RestClient
} = require('./restClient');

const Feature = require("../enum/Feature");

const {
  ensureFeatureName
} = require("../utils/Helpers");

class RestTestClient extends RestClient {
  constructor(app, endpoint, onSend, onError, onSent) {
    super(app, endpoint, onSend, onError, onSent);
    this.agent = app.tryRequire("supertest");
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
  type: Feature.SERVICE,
  groupable: true,
  load_: async function (app, settings, name) {
    ensureFeatureName(name);
    let client = new RestTestClient(app, settings);
    app.registerService(name, client);
  }
};
//# sourceMappingURL=superTest.js.map