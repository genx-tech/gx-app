"use strict";

/**
 * Enable timezone feature
 * @module Feature_Timezone
 */

const Feature = require('../enum/Feature');
const Literal = require('../enum/Literal');

module.exports = {

    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    type: Feature.INIT,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {string} timezone - Timezone info
     * @returns {Promise.<*>}
     */
    load_: (app, timezone) => {
        if (typeof timezone !== 'string') {
            throw new Error('Timezone value should be a string.');
        }

        let Luxon = app.tryRequire('luxon');
        const { DateTime } = Luxon;

        app.now = () => DateTime.local().setZone(timezone || Literal.DEFAULT_TIMEZONE);
        app.__ = { ...app.__, timezone };
    }
};