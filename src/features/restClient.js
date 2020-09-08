const { _, dropLeftIfStartsWith } = require('rk-utils');
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

function resToPath(parts) {
    return parts ? (Array.isArray(parts) ? parts.map(res => encodeURIComponent(res)).join('/') : dropLeftIfStartsWith(parts, '/')) : '';
}

/**
 * RESTful client.
 * @class
 */
class RestClient {
    constructor(endpoint, onSend, onError) {
        this.agent = tryRequire('superagent');
        this.endpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';
        this.onSend = onSend;
        this.onError = onError;
    }

    async do(method, path, query, body, options) {
        method = method.toLowerCase();
        let httpMethod = AllowedMethods[method];
        if (!httpMethod) {
            throw new Error('Invalid method: ' + method);
        }

        let req = this.agent[httpMethod]((path.startsWith('http:') || path.startsWith('https:')) ? path : ((options && options.endpoint ? options.endpoint : this.endpoint) + path));

        if (this.onSend) {
            this.onSend(req);
        }

        if (query) {
            req.query(query);
        }

        if (method === 'download') {
            req.send(body);
        } else if (method === 'upload') {
            if (options && options.formData) {
                _.forOwn(options.formData, (v, k) => {
                    req.field(k, v);
                });
            }
            req.attach("file", body);
        } else {
            req.send(body);
        }

        if (options && options.onProgress) {
            req.on('progress', options.onProgress);
        }

        try {
            let res = await req;

            if ((!res.body || res.body === '') && res.text !== '') {
                return res.text;
            }

            return res.body;
        } catch (error) {
            if (error.response && error.response.error) {
                if (this.onError) {
                    return this.onError(error.response.error);
                }

                throw error.response.error;
            }

            if (this.onError) {
                this.onError(error);
                return;
            }

            throw error;
        }
    }

    async get(resource, query, options) {
        return this.do('get',
            resToPath(resource),
            query, null, options);
    }

    async post(resource, data, query, options) {
        return this.do('post',
            resToPath(resource),
            query, data, options);
    }

    async put(resource, data, query, options) {
        return this.do('put',
            resToPath(resource),
            query, data, options);
    }

    async del(resource, query, options) {
        return this.do('del',
            resToPath(resource),
            query, null, options);
    }

    async upload(resource, file, query, options) {
        return this.do('upload',
            resToPath(resource),
            query, file, options);
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
    }
};