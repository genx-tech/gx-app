const Feature = require("../enum/Feature");
const { _ } = require("@genx/july");

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
        const loadings = [];

        _.each(services, (instances, serviceName) => {
            let feature = app._loadFeature(serviceName);
            _.each(instances, (serviceOptions, instanceName) => {
                loadings.push(
                    feature
                        .load_(app, serviceOptions, `${serviceName}-${instanceName}`)
                );
            });
        });

        await Promise.all(loadings);
    },
};
