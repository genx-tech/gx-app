"use strict";

require("source-map-support/register");

const Feature = require('../enum/Feature');

module.exports = {
  type: Feature.INIT,
  load_: function (app, envSettings) {
    Object.assign(process.env, envSettings);
  }
};
//# sourceMappingURL=env.js.map