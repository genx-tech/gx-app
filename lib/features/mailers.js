"use strict";

require("source-map-support/register");

const Feature = require('../enum/Feature');

const {
  _
} = require('@genx/july');

module.exports = {
  type: Feature.SERVICE,
  load_: async function (app, mailers) {
    const nodemailer = app.tryRequire('nodemailer');

    _.forOwn(mailers, (options, name) => {
      let transporter = nodemailer.createTransport(options);
      app.registerService(`mailers.${name}`, transporter);
    });
  }
};
//# sourceMappingURL=mailers.js.map