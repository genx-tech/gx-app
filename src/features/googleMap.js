"use strict";

const Feature = require('../enum/Feature');
const { tryRequire } = require('../utils/Helpers');

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
     * @property {object} options.clientOptions - The client options.
     * @returns {Promise.<*>}
     */
    load_: async function (app, options) {
        const { clientOptions = {}, apiKey } = options;
        const { Client, Status } = tryRequire('@googlemaps/google-maps-services-js');

        const client = new Client(clientOptions);
        const handleResult = (r) => {
            if (r.data.status !== Status.OK) {
                let level = r.data.status === Status.ZERO_RESULTS ? 'warn' : 'error';
                app.log(level, `[${r.data.status}]${r.data.error_message}`, { data: r.data });
            }             
            
            return r.data;
        };

        const service = {
            geocode_: async (address) => handleResult(await client.geocode({ params: { address, key: apiKey } }))
        };
          
        app.registerService("googleMap", service);  
    }
};