const Feature = require('../enum/Feature');
const { tryRequire } = require('../utils/Helpers');
const nodemailer = tryRequire('nodemailer');

module.exports = {

    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    type: Feature.SERVICE,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} options - Options for the feature
     * @property {string} options.host - SMTP host.
     * @property {number} options.port - SMTP port.
     * @property {boolean} options.sucure - SSL.
     * @property {object} options.auth - Auth info.
     * @property {string} options.auth.user - Username.
     * @property {string} options.auth.pass - Password.
     * @returns {Promise.<*>}
     */
    load_: async function (app, options) {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(options);    

        app.registerService('mailer', transporter);
    }
};