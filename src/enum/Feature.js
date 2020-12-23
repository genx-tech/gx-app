"use strict";

/**
 * Feature loading stage definitions
 * @module Feature
 * 
 * @example
 *   const Feature = require('@genx/app/lib/enum/Feature');
 */

/**
 * Feature level definitions.
 * @readonly
 * @enum {string}
 */

module.exports = {
    /**
     * Configuration
     */
    CONF: 'Configure',
    /**
     * Initialization, e.g. settings
     */
    INIT: 'Initial',    
    /**
     * Services, e.g. loggers, i18n
     */
    SERVICE: 'Services',       
    /**
     * Loading plugins, e.g. middlewares, bootstrap
     */
    PLUGIN: 'Plugins',
    /**
     * Final preparation before service container get into work
     */
    READY: 'Ready', 

    /**
     * Validate a feature object.
     * @param {object} featureObject - Feature object
     * @property {string} featureObject.type - Feature loading stage
     * @property {function} featureObject.load_ - Feature loading method
     * @returns {bool}
     */
    validate: function (featureObject) {
        return featureObject && featureObject.hasOwnProperty('type') && (typeof featureObject.load_ === 'function');
    }
};