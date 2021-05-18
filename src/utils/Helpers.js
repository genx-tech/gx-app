/**
 * Common helpers for service container.
 * @module Helpers
 */ 

const { _ } = require('@genx/july');
const { ApplicationError } = require('@genx/error');
const path = require('path');
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
        let value = _.get(config, key);
        if (_.isNil(value)) {
            throw new InvalidConfiguration(`Missing required config item "${key}".`, app, `${prefix}.${key}`);
        }
    })
};

exports.ensureFeatureName = name => {
    if (!name) throw new ApplicationError('This feature cannot be used in v1.x @genx/app.');
}

exports.scriptBaseName = (fileName) => path.basename(fileName, '.js');