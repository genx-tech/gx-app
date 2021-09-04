"use strict";

require("source-map-support/register");

const Feature = require('../enum/Feature');

module.exports = {
  type: Feature.CONF,
  load_: (app, registry) => {
    app.addFeatureRegistry(registry);
  }
};
//# sourceMappingURL=featureRegistry.js.map