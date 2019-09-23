const { _ } = require('rk-utils');
const Feature = require('../enum/Feature');
const { tryRequire } = require('../utils/Helpers');

/**
 * Enable a named rest client
 * @module Feature_RestClient
 */

const AllowedMethods = {
    'get': 'get',
    'post': 'post',
    'put': 'put',
    'del': 'del',
    'delete': 'del',
    'upload': 'post',
    'download': 'get'
};

/**
 * RESTful client.
 * @class
 */
class RestClient {
    constructor(endpoint, onSendHandler) {
        this.agent = tryRequire('superagent');
        this.endpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';
        this.onSendHandler = onSendHandler;
    }

    async _sendRequest_(req, streamMode) {
        if (this.onSendHandler) {
            this.onSendHandler(req);
        }

        if (streamMode) return req;

        try {
            let res = await req;
            return res.type === 'text/plain' ? res.text : (res.body || res.text);
        } catch (error) {
            if (this.onErrorHandler) {
                let stopProcess = await this.onErrorHandler(error);
                if (stopProcess) {
                    return undefined;
                }
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

    /**
     * Call a restful method.
     * @param {*} method 
     * @param {*} path 
     * @param {*} query 
     * @param {*} body 
     * @param {*} streamMode 
     * @returns {Promise}
     */
    async call_(method, path, query, body, streamMode) {
        method = method.toLowerCase();
        let httpMethod = AllowedMethods[method];
        if (!httpMethod) {
            throw new Error('Invalid method: ' + method);
        }

        if (path[0] === '/') {
            path = path.substr(1);
        }

        let req = this.agent[httpMethod](this.endpoint + path);
        if (query) {
            req.query(query);
        }

        if (method === 'download') {
            req.responseType('blob');
        } else if (method === 'upload') {
            req.attach("file", body);
        } else if (body) {
            req.send(body);            
        }

        return this._sendRequest_(req, streamMode);
    }

    /**
     * Get the detail of a single entity.
     * @param {*} resource 
     * @param {*} id 
     * @param {*} query 
     */
    async getOne_(resource, id, query) {
        return this.call_('get', encodeURIComponent(resource) + '/' + encodeURIComponent(id), query);
    }

    /**
     * Get a list of entities.
     * @param {*} resource 
     * @param {*} query 
     */
    async getList_(resource, query) {
        return this.call_('get', encodeURIComponent(resource), query);
    }

    /**
     * Create a new entity.
     * @param {*} resource 
     * @param {*} data 
     */
    async create_(resource, data) {
        return this.call_('post', encodeURIComponent(resource), null, data);
    }

    /**
     * Update a specified entity.
     * @param {*} resource 
     * @param {*} id 
     * @param {*} data 
     */
    async updateOne_(resource, id, data) {
        return this.call_('put', encodeURIComponent(resource) + '/' + encodeURIComponent(id), null, data);
    }

    /**
     * Update some of the entities.
     * @param {*} resource 
     * @param {*} where 
     * @param {*} data 
     */
    async updateAny_(resource, where, data) {
        return this.call_('put', encodeURIComponent(resource), where, data);
    }    

    /**
     * Remove a specified entity.
     * @param {*} resource 
     * @param {*} id 
     */
    async removeOne_(resource, id) {
        return this.call_('del', encodeURIComponent(resource) + '/' + encodeURIComponent(id));
    }

    /**
     * Remove some of the entities.
     * @param {*} resource 
     * @param {*} where 
     */
    async removeAny_(resource, where) {
        return this.call_('del', encodeURIComponent(resource), where);
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
            let client = new RestClient(endpoint);
            app.registerService(`restClient.${name}`, client);
        });        
    },

    RestClient: RestClient
};