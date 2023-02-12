const { _, url: urlUtil } = require("@genx/july");
const Feature = require("../enum/Feature");
const { ensureFeatureName } = require("../utils/Helpers");

/**
 * Enable a http client as service
 * @module Feature_HttpClient
 */

const AllowedMethods = {
    get: "get",
    post: "post",
    put: "put",
    del: "del",
    delete: "del",
    upload: "post",
    download: "get",
};

function resToPath(parts) {
    return parts ? (Array.isArray(parts) ? parts.map((res) => encodeURIComponent(res)).join("/") : parts) : "";
}

/**
 * HTTP client.
 * @class
 */
class HttpClient {
    /**
     *
     * @param {*} endpoint
     */
    constructor(agent, endpointOrOptions) {
        this.agent = agent;
        this.options = typeof endpointOrOptions === "string" ? { endpoint: endpointOrOptions } : endpointOrOptions;
    }

    initReq(httpMethod, url) {
        return this.agent[httpMethod](url);
    }

    /**
     *
     * @param {string} method
     * @param {string} path
     * @param {object} query
     * @param {object} body
     * @param {object} options - Request options
     * @property {string} [options.httpMethod] - Specified the http method to override the method argument
     * @property {string} [options.endpoint] - Specified the base endpoint for this request only
     * @property {function} [options.onSend] - Specified the onSend hook for this request only
     * @returns
     */
    async do(method, path, query, body, options) {
        method = method.toLowerCase();
        const _options = { ...this.options, ...options };

        let httpMethod = _options.httpMethod ?? AllowedMethods[method];
        if (!httpMethod) {
            throw new Error("Invalid method: " + method);
        }

        let url = path.startsWith("http:") || path.startsWith("https:") ? path : urlUtil.join(_options.endpoint, path);

        let req = this.initReq(httpMethod, url);

        if (this.onSend) {
            this.onSend(req);
        }

        if (_options.onSend) {
            _options.onSend(req);
        }

        if (_options.timeout) {
            req.timeout(_options.timeout);
        }

        if (_options.headers) {
            _.forOwn(_options.headers, (v, k) => {
                req.set(k, v);
            });
        }

        if (_options.withCredentials) {
            req.withCredentials();
        }

        if (query) {
            req.query(query);
        }

        if (method === "download") {
            req.send(body);
        } else if (method === "upload") {
            if (_options.formData) {
                _.forOwn(_options.formData, (v, k) => {
                    req.field(k, v);
                });
            }
            req.attach(_options.fileField ?? "file", body, _options.fileName);
        } else {
            req.send(body);
        }

        if (_options.onProgress) {
            req.on("progress", _options.onProgress);
        }

        try {
            const res = await req;
            const result = res.type.startsWith("text/") ? res.text : res.body;

            if (this.onSent) {
                await this.onSent(url, result, res);
            }

            if (_options.onSent) {
                await _options.onSent(url, result, res);
            }

            return result;
        } catch (error) {
            if (error.response && error.response.error) {
                const _responseError = error.response.error;

                if (error.response.type === "application/json") {
                    _responseError.body = JSON.parse(error.response.text);
                }

                if (_options.onError) {
                    return _options.onError(_responseError, error);
                }

                if (this.onError) {
                    return this.onError(_responseError, error);
                }

                throw _responseError;
            }

            if (_options.onError) {
                return _options.onError(error);
            }

            if (this.onError) {
                return this.onError(error);
            }

            throw error;
        }
    }

    async get(resource, query, options) {
        return this.do("get", resToPath(resource), query, null, options);
    }

    async post(resource, data, query, options) {
        return this.do("post", resToPath(resource), query, data, options);
    }

    async put(resource, data, query, options) {
        return this.do("put", resToPath(resource), query, data, options);
    }

    async del(resource, query, options) {
        return this.do("del", resToPath(resource), query, null, options);
    }

    async upload(resource, file, query, options) {
        return this.do("upload", resToPath(resource), query, file, options);
    }

    async download(resource, query, options) {
        return this.do("download", resToPath(resource), query, null, options);
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

    HttpClient,

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
