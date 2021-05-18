"use strict";

/**
 * Replace the default app logger
 * @module Feature_AppLogger
 */

const { InvalidConfiguration } = require('@genx/error');
const Feature = require('../enum/Feature');

module.exports = {

    /**
     * This feature is loaded at plugin stage
     * @member {string}
     */
    type: Feature.PLUGIN,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {string} loggerName - The logger name     
     */
    load_: (app, loggerName) => {
        let logger = app.getService('logger.' + loggerName);

        if (!logger) {
            throw new InvalidConfiguration(`Logger "${loggerName}" not found.`, app, 'appLogger');
        }

        app.replaceLogger(logger);

        app.on('stopping', () => {
            app.replaceLogger(/* back to original */);
        }); 
    }
};