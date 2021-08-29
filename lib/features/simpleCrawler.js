"use strict";

require("source-map-support/register");

const Feature = require('../enum/Feature');

const {
  ensureFeatureName
} = require("../utils/Helpers");

const basicAuth = (req, authInfo) => {
  req.auth(authInfo.username, authInfo.password);
};

const bearerAuth = (req, authInfo) => {
  req.set('Authorization', `Bearer ${authInfo}`);
};

class SimpleCrawler {
  constructor(app, settings) {
    this.agent = app.tryRequire('superagent');

    if (settings.saveCookies) {
      this.agent = this.agent.agent();
    }

    let timeout = {
      response: 5000,
      deadline: 60000
    };

    if (settings.responseTimeout) {
      timeout.response = settings.responseTimeout;
    }

    if (settings.deadlineTimeout) {
      timeout.deadline = settings.deadlineTimeout;
    }

    if (settings.parser) {
      if (settings.parser === 'cheerio') {
        let parser = app.tryRequire('cheerio');

        this._afterReceive = text => {
          return parser.load(text);
        };
      }
    }

    this._beforeSend = req => {
      req.timeout(timeout);

      if (settings.basicAuth) {
        basicAuth(req, settings.basicAuth);
      } else if (settings.bearerAuth) {
        bearerAuth(req, settings.bearerAuth);
      }
    };
  }

  async _sendRequest_(req) {
    this._beforeSend(req);

    req.buffer(true);

    try {
      let res = await req;
      return this._afterReceive ? this._afterReceive(res.text) : res.text;
    } catch (error) {
      if (this.onErrorHandler) {
        await this.onErrorHandler(error);
      }

      if (error.response) {
        let {
          status,
          body,
          text
        } = error.response;
        let message = body && body.error || error.response.error && error.response.error.message || text;
        error.message = message;
        error.status = status;
      }

      throw error;
    }
  }

  async get_(url, query) {
    let req = this.agent.get(url);

    if (query) {
      req.query(query);
    }

    return this._sendRequest_(req);
  }

  async post_(url, query, body) {
    let req = this.agent.post(url);

    if (query) {
      req.query(query);
    }

    if (body) {
      req.send(body);
    }

    return this._sendRequest_(req);
  }

}

module.exports = {
  type: Feature.SERVICE,
  groupable: true,
  load_: async function (app, settings, name) {
    ensureFeatureName(name);
    let client = new SimpleCrawler(app, settings);
    app.registerService(name, client);
  }
};