"use strict";

/**
 * Error definitions.
 * @module Errors
 */

 /**
 * General errors with error info, http status and error code.
 * @class
 * @extends Error  
 */
class GeneralError extends Error {
    constructor(message, info, status, code) {
        super(message);

        this.name = this.constructor.name;
        let typeOfInfo = typeof info;
        let typeOfStatus = typeof status;
        let typeOfCode = typeof code;

        if (typeOfCode === 'undefined') {
            if (typeOfStatus === 'string') {
                code = status;
                status = undefined;
                typeOfStatus = 'undefined';
            } 
        }

        if (typeOfStatus === 'undefined') {
            if (typeOfInfo === 'number') {
                status = info;
                info = undefined;
            }

            if (typeOfCode === 'undefined' && typeOfInfo === 'string') {
                code = info;
                info = undefined;
            }
        }       

        /**
         * Error information
         * @member {object}
         */
        this.info = info;

        /**
         * Http status
         * @member {number}
         */
        this.status = status;

        /**
         * Error code
         * @member {string}
         */
        this.code = code;        
    }
}

/**
 * Application errors.
 * @class
 * @extends GeneralError  
 */
class ApplicationError extends GeneralError {
    /**     
     * @param {string} message - Error message     
     * @param {*} info
     * @param {*} code 
     */
    constructor(message, info, code) {
        super(message, info, 500, code || 'E_APP');
    }
} 

/**
 * Request errors.
 * @class
 * @extends GeneralError  
 */
class RequestError extends GeneralError {
    /**     
     * @param {string} message - Error message     
     * @param {*} info
     * @param {*} code 
     */
    constructor(message, info, code) {
        super(message, info, 400, code || 'E_REQ');

        /**
         * Flas to pass detailed error message to the client
         * @member {string}
         */
        this.expose = true;
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
        super(message, { app: app.name, configNode: item }, 'E_INVALID_CONF');
    }
}

exports.GeneralError = GeneralError;
exports.RequestError = RequestError;
exports.ApplicationError = ApplicationError;
exports.InvalidConfiguration = InvalidConfiguration;