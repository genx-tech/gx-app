"use strict";

require("source-map-support/register");

const {
  _
} = require("@genx/july");

const Feature = require("../enum/Feature");

const {
  ensureFeatureName
} = require("../utils/Helpers");

const AllowedMethods = {
  get: "get",
  post: "post",
  put: "put",
  del: "del",
  delete: "del",
  upload: "post",
  download: "get"
};

function resToPath(parts) {
  return parts ? Array.isArray(parts) ? parts.map(res => encodeURIComponent(res)).join("/") : parts : "";
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

class RestClient {
  constructor(app, endpoint) {
    this.agent = app.tryRequire("superagent");
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

    let url = path.startsWith("http:") || path.startsWith("https:") ? path : joinEndpoint(options && options.endpoint ? options.endpoint : this.endpoint, path);
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
      const result = res.type === 'text/plain' ? res.text : res.body;

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

  async download(resource, query, options) {
    return this.do("download", resToPath(resource), query, null, options);
  }

}

module.exports = {
  type: Feature.SERVICE,
  groupable: true,
  RestClient,
  load_: async function (app, settings, name) {
    ensureFeatureName(name);
    let client = new RestClient(app, settings);
    app.registerService(name, client);
  }
};