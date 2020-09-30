"use strict";

const { dropLeftIfStartsWith } = require('rk-utils');
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
     * @property {string} options.RegionId - The RegionId param.
     * @returns {Promise.<*>}
     * 
     * @example
     * 
     * accessKeyId: '<accessKeyId>',
     * accessKeySecret: '<accessSecret>',
     * endpoint: 'https://sms-intl.ap-southeast-1.aliyuncs.com',
     * apiVersion: '2018-05-01'
     */
    load_: async function (app, options) {
        const { RegionId, ...opts } = options;
        const Core = tryRequire('@alicloud/pop-core');

        let client = new Core(opts);

        const service = {
            sendMessageToGlobe_: async (to, message) => {
                const params = {
                    RegionId,
                    To: dropLeftIfStartsWith(to, '+'),
                    Message: message
                  };
                  
                  const requestOption = {
                    method: 'POST'
                  };

                return client.request('SendMessageToGlobe', params, requestOption);
            }
        };
          
        app.registerService("aliCloudPopCore", service);  
    }
};