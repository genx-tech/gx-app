"use strict";

/**
 * Common helpers for service container.
 * @module Helpers
 */ 

 const { _ } = require('rk-utils');
 const spawn = require('child_process').spawn;

 /**
  * @param {string|array.<string>} features - Dependencies of other features.
  * @param {ServiceContainer} app - Origin service container app.
  * @param {string} fromFeature - Dependent feature.
  */
exports.dependsOn = function (features, app, fromFeature) {
    let hasNotEnabled = _.find(_.castArray(features), feature => !app.enabled(feature));

    if (hasNotEnabled) {
        throw new Error(`"${fromFeature}" feature requires "${hasNotEnabled}" feature to be enabled.`);
    }
};

/**
 * Try require a package module and show install tips if not found.
 * @param {string} packageName
 */
exports.tryRequire = function (packageName) {

    function tryRequireBy(packageName, mainModule, throwWhenNotFound) {
        try {
            return mainModule.require(packageName);
        } catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                if (throwWhenNotFound) {
                    let pkgPaths = packageName.split('/');
                    let npmPkgName = pkgPaths[0];
                    if (pkgPaths[0].startsWith('@') && pkgPaths.length > 1) {
                        npmPkgName += '/' + pkgPaths[1];
                    }

                    throw new Error(`Module "${packageName}" not found. Try run "npm install ${npmPkgName}" to install the dependency.`);
                }                

                return undefined;
            }

            throw error;
        }
    }

    return tryRequireBy(packageName, module) || tryRequireBy(packageName, require.main, true);
};

/**
 * Add a expose property to the error object.
 * @mixin
 * @param {*} Base 
 */
exports.withExpose = (Base) => class extends Base {
    expose = true;    
};

/**
 * Add a name property of which the value is the class name.
 * @mixin
 * @param {*} Base 
 */
exports.withName = (Base) => class extends Base {    
    constructor(...args) {
        super(...args);

        /**
         * Error name.
         * @member {string}
         */
        this.name = this.constructor.name;
    }    
};

/**
 * Add an extraInfo property and passed in by extra construtor arguments.
 * @mixin
 * @param {*} Base 
 */
exports.withExtraInfo = (Base) => class extends Base {    
    constructor(...args) {
        super(...args);

        let expectedNumArgs = super.constructor.length;

        if (args.length > expectedNumArgs) {
            let extra = args.slice(expectedNumArgs);

            /**
             * Extra error info.
             * @member {object}
             */
            this.extraInfo = extra.length > 1 ? extra : extra[0];
        }
    }
};

/**
 * Restart the current process.
 * @param {object} envVariables - Environment variables
 */
exports.restart = function (envVariables) {
    let processOptions = {        
        env: { ...process.env, ...envVariables },
        detached: true,
        stdio: 'ignore'
    };

    let cp = spawn(process.argv[0], process.argv.slice(1), processOptions);
    cp.unref();
    process.exit(0);
};
