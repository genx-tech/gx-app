"use strict";

/**
 * Set the runtime environment flag, which is different from source code build env (development|production)
 * @module Feature_RuntimeEnv
 */

const Feature = require('../enum/Feature');

module.exports = {

    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    type: Feature.INIT,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {string} envFlag - Environment flag, e.g. local|ci|cd|stagging|ppe|prod
     * @returns {Promise.<*>}
     */
    load_: function (app, envFlag) {
        app.runtimeEnv = envFlag;
    }
};