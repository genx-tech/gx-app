const Feature = require('../enum/Feature');
const { tryRequire } = require('../utils/Helpers');
const { _ } = require('rk-utils');

module.exports = {

    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    type: Feature.SERVICE,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} mailers - Options for the feature     
     * @returns {Promise.<*>}
     */
    load_: async function (app, mailers) {
        const nodemailer = tryRequire('nodemailer');

        // create reusable transporter object using the default SMTP transport        

        _.forOwn(mailers, (options, name) => {
            let transporter = nodemailer.createTransport(options);    

            app.registerService(`mailers.${name}`, transporter);
        });
    }
};