"use strict";

require("source-map-support/register");

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
  type: Feature.PLUGIN,
  load_: async (server, entries) => {
    console.log('lib module');

    const {
      LibModule
    } = server.tryRequire('@genx/server');
    return eachAsync_(entries, async (config, name) => {
      let options = Object.assign({
        env: server.env,
        logWithAppName: server.options.logWithAppName
      }, config.options);
      let appPath;

      if (config.npmModule) {
        appPath = server.toAbsolutePath("node_modules", name);
      } else {
        const appModulesPath = server.appModulesPath || server.toAbsolutePath(server.options.appModulesPath);
        appPath = path.join(appModulesPath, name);
      }

      let exists = (await fs.pathExists(appPath)) && (await fs.stat(appPath)).isDirectory();

      if (!exists) {
        throw new InvalidConfiguration(`Lib [${name}] not exists.`, server, `libModules.${name}`);
      }

      let lib = new LibModule(server, name, appPath, options);
      lib.on("configLoaded", () => {
        if (!_.isEmpty(config.settings)) {
          lib.config.settings = Object.assign({}, lib.config.settings, config.settings);
          server.log("verbose", `Lib settings of [${lib.name}] is overrided.`);
        }
      });
      let relativePath = path.relative(server.workingPath, appPath);
      server.log("verbose", `Loading lib [${lib.name}] from "${relativePath}" ...`);
      await lib.start_();
      server.registerLib(lib);
      server.log("verbose", `Lib [${lib.name}] is loaded.`);
      console.log('feiofjaifejfiwefo');
    });
  }
};
//# sourceMappingURL=libModules.js.map