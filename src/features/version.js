"use strict";

/**
 * Set app version
 * @module Feature_Version
 */

const { fs } = require('@genx/sys');
const Feature = require('../enum/Feature');

module.exports = {

    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    type: Feature.INIT,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {string} version - Version information, use @package.version to use the version info from package.json located under working folder
     * @returns {Promise.<*>}
     */
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