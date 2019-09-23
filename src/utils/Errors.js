"use strict";

/**
 * Error definitions.
 * @module Errors
 */

const { withName, withExtraInfo, withExpose } = require('./Helpers');

const RichInfoError = withExtraInfo(withName(Error));
const RequestError = withExpose(RichInfoError);

/**
 * Error caused by all kinds of runtime errors.
 * @class
 * @extends RichInfoError  
 */
class ApplicationError extends RichInfoError {
    /**     
     * @param {string} message - Error message
     * @param {*} code 
     * @param {*} otherExtra
     */
    constructor(message, code, otherExtra) {
        if (arguments.length === 2 && typeof code === 'object') {
            otherExtra = code;
            code = undefined;            
        } else if (code !== undefined && otherExtra && !('code' in otherExtra)) {
            otherExtra = Object.assign({}, otherExtra, { code });
        }

        super(message, otherExtra);

        if (code !== undefined) {
            /**
             * Error Code
             * @member {integer|string}
             */
            this.code = code;
        }
    }
} 

/**
 * Error caused by invalid configuration.
 * @class
 * @extends ApplicationError  
 */
class InvalidConfiguration extends ApplicationError {
    /**
     * @param {string} message - Error message
     * @param {App} [app] - The related app module
     * @param {string} [item] - The related config item   
     */ 
    constructor(message, app, item) {        
        super(message, 'E_INVALID_CONFIG', { app: app.name, configNode: item });
    }
}

exports.RequestError = RequestError;
exports.ApplicationError = ApplicationError;
exports.RichInfoError = RichInfoError;
exports.InvalidConfiguration = InvalidConfiguration;