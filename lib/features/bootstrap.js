"use strict";

require("source-map-support/register");

const path = require("path");

const Feature = require("../enum/Feature");

const Literal = require("../enum/Literal");

const {
  eachAsync_
} = require("@genx/july");

const {
  glob
} = require("@genx/sys");

module.exports = {
  type: Feature.PLUGIN,
  load_: async function (app, options) {
    let bootPath = options.path ? app.toAbsolutePath(options.path) : path.join(app.workingPath, Literal.DEFAULT_BOOTSTRAP_PATH);
    let bp = path.join(bootPath, "**", "*.js");
    let files = await glob(bp, {
      nodir: true
    });
    return eachAsync_(files, async file => {
      let bootstrap = require(file);

      return bootstrap(app);
    });
  }
};