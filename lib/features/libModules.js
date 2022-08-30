"use strict";
/**
 * Load lib modules
 * @module Feature_LibModules
 *
 * @example
 *
 *  'libModules': {
 *      '<name>': {
 *          npmModule: false, // whether is a npm module
 *          options: { // module options
 *          },
 *          settings: { // can override module defined settings
 *          }
 *      }
 *  }
 */

const path = require("path");

const {
  _,
  eachAsync_
} = require("@genx/july");

const {
  fs
} = require("@genx/sys");

const Feature = require("../enum/Feature");

const {
  InvalidConfiguration
} = require("@genx/error");

module.exports = {
  /**
   * This feature is loaded at plugin stage.
   * @member {string}
   */
  type: Feature.PLUGIN,

  /**
   * Load the feature.
   * @param {App} app - The app module object.
   * @param {object} entries - Lib module entries.
   * @returns {Promise.<*>}
   */
  load_: async (app, entries) => {
    const {
      LibModule
    } = app.tryRequire('@genx/server');
    return eachAsync_(entries, async (config, name) => {
      let options = Object.assign({
        env: app.env,
        logWithAppName: app.options.logWithAppName
      }, config.options);
      let appPath;

      if (config.npmModule) {
        appPath = app.toAbsolutePath("node_modules", name);
      } else {
        const appModulesPath = app.appModulesPath || app.toAbsolutePath(app.options.appModulesPath);
        appPath = path.join(appModulesPath, name);
      }

      let exists = (await fs.pathExists(appPath)) && (await fs.stat(appPath)).isDirectory();

      if (!exists) {
        throw new InvalidConfiguration(`Lib [${name}] not exists.`, app, `libModules.${name}`);
      }

      let lib = new LibModule(app, name, appPath, options);
      lib.on("configLoaded", () => {
        if (!_.isEmpty(config.settings)) {
          lib.config.settings = Object.assign({}, lib.config.settings, config.settings);
          app.log("verbose", `Lib settings of [${lib.name}] is overrided.`);
        }
      });
      let relativePath = path.relative(app.workingPath, appPath);
      app.log("verbose", `Loading lib [${lib.name}] from "${relativePath}" ...`);
      await lib.start_();
      app.registerLib(lib);
      app.log("verbose", `Lib [${lib.name}] is loaded.`);
    });
  }
};
//# sourceMappingURL=libModules.js.map