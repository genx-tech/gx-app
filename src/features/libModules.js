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
const { _, fs, eachAsync_ } = require("rk-utils");
const Feature = require("../enum/Feature");
const { InvalidConfiguration } = require("../utils/Errors");
const { tryRequire } = require('../utils/Helpers');

module.exports = {
    /**
     * This feature is loaded at plugin stage.
     * @member {string}
     */
    type: Feature.PLUGIN,

    /**
     * Load the feature.
     * @param {WebServer} server - The web server module object.
     * @param {object} entries - Lib module entries.
     * @returns {Promise.<*>}
     */
    load_: async (server, entries) => {
        const { LibModule } = tryRequire('@genx/server');

        return eachAsync_(entries, async (config, name) => {
            let options = Object.assign(
                {
                    env: server.env,
                    logWithAppName: server.options.logWithAppName,
                },
                config.options
            );

            let appPath;

            if (config.npmModule) {
                appPath = server.toAbsolutePath("node_modules", name);
            } else {
                appPath = path.join(server.appModulesPath, name);
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
        });
    },
};
