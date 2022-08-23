const Feature = require("../enum/Feature");
const { _, eachAsync_ } = require("@genx/july");

/**
 * Enable a service group
 * @module Feature_ServiceGroup
 */

module.exports = {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    type: Feature.SERVICE,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} services - Map of services from service registration to service instance options
     * @returns {Promise.<*>}
     *
     * @example
     *
     * serviceGroup: { 's3DigitalOcean': { '<instanceName>': {  } }   }
     */
    load_: async function (app, services) {
        await eachAsync_(services, async (instances, serviceName) => {
            let feature = app._loadFeature(serviceName);
            await eachAsync_(instances, (serviceOptions, instanceName) =>
                feature.load_(app, serviceOptions, `${serviceName}-${instanceName}`)
            );
        });
    },
};
