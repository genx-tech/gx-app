"use strict";

/**
 * Enable LRU cache feature
 * @module Feature_LruCache
 */

const Feature = require('../enum/Feature');
const { tryRequire } = require('../utils/Helpers');
const { _ } = require('rk-utils');

module.exports = {

    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    type: Feature.SERVICE,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} resourceOptions - The cache options for specified resource
     * @property {object} [resourceOptions.default] - Default options, will be overrided by resource-specific options if any
     * @property {object} [resourceOptions.resources] - Resource-specific options
     * @returns {Promise.<*>}
     */
    load_: (app, resourceOptions) => {
        let LRU = tryRequire('lru-cache');

        //pre-create
        if (resourceOptions.resources) {
            _.map(resourceOptions.resources, (options, resource) => {
                let cache = new LRU(options);
                app.registerService('lruCache:' + resource, cache);
            });
        }

        const cacheService = {
            res: (resource) => {
                let key = 'lruCache:' + resource;
                let cache = app.getService(key);
                if (cache) return cache;

                let options = resourceOptions["default"] || { max: 0 };

                if (resourceOptions.resources && (resource in resourceOptions.resources)) {
                    options = { ...options, ...resourceOptions.resources[resource] };
                }

                cache = new LRU(options);
                app.registerService(key, cache);
                return cache;
            },

            reset: (resource) => {
                let cache = cacheService.res(resource);
                cache.reset();
                return cache;
            }
        };
        
        app.registerService('lruCache', cacheService);
    }
};