const { _ } = require("rk-utils");
const Feature = require("../enum/Feature");
const { tryRequire } = require("../utils/Helpers");

/**
 * Enable a named rest client
 * @module Feature_RestClient
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
    return parts
        ? Array.isArray(parts)
            ? parts.map((res) => encodeURIComponent(res)).join("/")
            : parts
        : "";
}

function joinEndpoint(p1, p2) {
    if (p2) {
        if (p1) {
            p1.endsWith("/") || (p1 += "/");
            p2.startsWith("/") && (p2 = p2.substr(1));
        } else if (!p2.startsWith("/")) {
            p1 = "/";
        }

        return p1 + p2;
    }

    return p1;
}

/**
 * RESTful client.
 * @class
 */
class RestClient {
    constructor(endpoint) {
        this.agent = tryRequire("superagent");
        this.endpoint = endpoint;        
    }

    initReq(httpMethod, url) {
        return this.agent[httpMethod](url);
    }

    async do(method, path, query, body, options) {
        method = method.toLowerCase();
        let httpMethod = AllowedMethods[method];
        if (!httpMethod) {
            throw new Error("Invalid method: " + method);
        }

        let url =
            (path.startsWith("http:") || path.startsWith("https:"))
                ? path
                : joinEndpoint((options && options.endpoint ? options.endpoint : this.endpoint), path);

        let req = this.initReq(httpMethod, url);

        if (this.onSend) {
            this.onSend(req);
        }

        if (query) {
            req.query(query);
        }

        if (method === "download") {
            req.send(body);
        } else if (method === "upload") {
            if (options && options.formData) {
                _.forOwn(options.formData, (v, k) => {
                    req.field(k, v);
                });
            }
            req.attach(options && options.fileField ? options.fileField : "file", body);
        } else {
            req.send(body);
        }

        if (options && options.onProgress) {
            req.on("progress", options.onProgress);
        }

        try {
            const res = await req;
            const result = ((!res.body || res.body === "") && res.text !== "") ? res.text : res.body;

            if (this.onSent) {
                await this.onSent(url, result);
            }

            return result;
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
}

module.exports = {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    type: Feature.SERVICE,

    RestClient,

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
};
