"use strict";

require("source-map-support/register");

const {
  fs
} = require('@genx/sys');

const Feature = require('../enum/Feature');

module.exports = {
  type: Feature.INIT,
  load_: async function (app, version) {
    if (version === '@package.version') {
      let pkgFile = app.toAbsolutePath('package.json');

      if (!(await fs.exists(pkgFile))) {
        throw new Error('"package.json" not found in working directory. CWD: ' + app.workingPath);
      }

      let pkg = await fs.readJson(pkgFile);
      version = pkg.version;
    }

    app.version = version;
  }
};