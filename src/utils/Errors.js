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

/**
 * Error caused by invalid function argument. Not suitable for http request, which should use RequestError
 * @class
 * @extends InvalidArgument  
 */
class InvalidArgument extends ApplicationError {
    /**
     * @param {string} message - Error message
     * @param {*} [info] - Extra info
     * @param {string} [item] - The related config item   
     */ 
    constructor(message, info) {        
        super(message, info, 'E_INVALID_ARG');
    }
}

exports.GeneralError = GeneralError;
exports.ApplicationError = ApplicationError;
exports.InvalidArgument = InvalidArgument;
exports.InvalidConfiguration = InvalidConfiguration;