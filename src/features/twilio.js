"use strict";

const Feature = require('../enum/Feature');
const { tryRequire, requireConfig, scriptBaseName } = require('../utils/Helpers');

const FEATURE_NAME = scriptBaseName(__filename);

module.exports = {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    type: Feature.SERVICE,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} options - Options for the feature
     * @property {string} options.accountSid - The ACCOUNT SID param.
     * @property {string} options.authToken - The AUTH TOKEN param.
     * @property {string} options.from - The from param, e.g. +14155552671
     * @see {@link https://www.twilio.com/docs/glossary/what-e164|E.164}
     * @returns {Promise.<*>}
     *
     * @example
     *
     * accountSid: '<ACCOUNT SID>',
     * authToken: '<AUTH TOKEN>'
     */
    load_: async function (app, options) {
        requireConfig(app, options, ['accountSid', 'authToken', 'from'], FEATURE_NAME)

        const { accountSid, authToken, from } = options;
        const Twilio = tryRequire("twilio");

        let client = new Twilio(accountSid, authToken);

        const service = {            
            from,
            sendSms_: async (to, body) => {
                const msg = await client.messages
                    .create({from, to, body});

                return msg;
            }
        };

        app.registerService(FEATURE_NAME, service);
    },
};
