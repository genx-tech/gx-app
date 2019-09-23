const { _ } = require('rk-utils');
const Feature = require('../enum/Feature');
const { tryRequire } = require('../utils/Helpers');

const basicAuth = (req, authInfo) => {
    req.auth(authInfo.username, authInfo.password);
}

const bearerAuth = (req, authInfo) => {
    req.set('Authorization', `Bearer ${authInfo}`);
}

class SimpleCrawler {
    constructor(settings) {
        this.agent = tryRequire('superagent');

        if (settings.saveCookies) {
            this.agent = this.agent.agent(); // create a separate cookie jar
        }

        //timeout
        let timeout = {
            response: 5000, // Wait 5 seconds for the server to start sending,
            deadline: 60000 // but allow 1 minute for the file to finish loading.
        };

        if (settings.responseTimeout) {
            timeout.response = settings.responseTimeout;
        }

        if (settings.deadlineTimeout) {
            timeout.deadline = settings.deadlineTimeout;
        }

        if (settings.parser) {
            if (settings.parser === 'cheerio') {
                let parser = tryRequire('cheerio');
                this._afterReceive = (text) => {
                    return parser.load(text);
                };
            } 
        } 

        this._beforeSend = (req) => {
            //timeout
            req.timeout(timeout);

            //auth
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
                let { status, body, text } = error.response;

                let message = (body && body.error) || (error.response.error && error.response.error.message) || text;
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

    /**
     * This feature is loaded at plugin stage
     * @member {string}
     */
    type: Feature.PLUGIN,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of simple crawler
     * @property {boolean} [settings.saveCookies] - Flag of save cookies or not
     * @property {object} [settings.basicAuth] - Basic authentication
     * @property {string} [settings.bearerAuth] - Bearer authentication
     * @property {number} [settings.responseTimeout] - Sets maximum time (ms) to wait for the first byte to arrive from the server, but it does not limit how long the entire download can take.
     * @property {number} [settings.deadlineTimeout] - Sets a deadline (ms) for the entire request (including all uploads, redirects, server processing time) to complete.
     * 
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings) {
        let client = new SimpleCrawler(settings);
        app.registerService('simpleCrawler', client);    
    }
};