/**
 * Common helpers for service container.
 * @module Helpers
 */ 

 const { _, getValueByPath } = require('rk-utils');
 const spawn = require('child_process').spawn;

/**
 * Returns a new class mixing with given properties and initial values.
 * @mixin
 * @param {*} Base 
 * @param {object} Props 
 */
exports.withProps = (Base, Props) => class extends Base {
    constructor(...args) {
        super(...args);

        Object.assign(this, Props);
    }
};

/**
 * Fill arguments into given position
 * @mixin
 * @param {*} Base 
 * @param {integer} ArgIndex 
 */
exports.withArgFill = (Base, ArgIndex, ...Value) => class extends Base {
    constructor(...args) {
        super(args.splice(ArgIndex, 0, ...Value));
    }
};

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

                    console.log(error.message);

                    throw new Error(`Module "${packageName}" not found. Try run "npm install ${npmPkgName}" to install the dependency.`);
                }                

                return undefined;
            }

            throw error;
        }
    }

    return tryRequireBy(packageName, module, require.main === module) || tryRequireBy(packageName, require.main, true);
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

exports.requireConfig = function (app, config, keys, prefix) {
    const { InvalidConfiguration } = require('./Errors');

    keys.forEach(key => {
        let value = getValueByPath(config, key);
        if (_.isNil(value)) {
            throw new InvalidConfiguration(`Missing required config item "${key}".`, app, `${prefix}.${key}`);
        }
    })
};