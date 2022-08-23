const Feature = require('../enum/Feature');

const {
  _
} = require('@genx/july');

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
    const nodemailer = app.tryRequire('nodemailer'); // create reusable transporter object using the default SMTP transport        

    _.forOwn(mailers, (options, name) => {
      let transporter = nodemailer.createTransport(options);
      app.registerService(`mailers.${name}`, transporter);
    });
  }
};
//# sourceMappingURL=mailers.js.map