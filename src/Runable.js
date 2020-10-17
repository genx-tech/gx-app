"use strict";

const Util = require('rk-utils');
const { _, sleep_, eachAsync_ } = Util;

const winston = require('winston');
const winstonFlight = require('winstonflight');
const Logger = require('winston/lib/winston/logger');

/**
 * Runable app mixin. 
 * @param {object} T - Base class.     
 * @returns {Runable} A runable app class.
 * @constructs Runable(T)
 */
const Runable = T => class extends T {
    _getOnUncaughtException = exitOnError => err => {
        if (exitOnError) {
            //wait 1 second for flushing the last log
            let waitForLogging = setTimeout(() => {
                process.exit(1);
            }, 1000);

            this.log('error', err, () => {
                clearTimeout(waitForLogging);
                process.exit(1);
            });
        } else {
            this.logError(err);
        }
    };        

    _onWarning = warning => {
        this.log('warn', warning.message);   
    };

    _onExit = code => {
        if (this.started) {
            this.stop_().catch(this.logError);
        }           
    };

    /**                 
     * @param {string} name - The name of the application.     
     * @param {object} [options] - Application options     
     * @property {object} [options.logger] - Logger options    
     * @property {object} [options.ignoreUncaught=false] - Whether to skip the handling of uncaught exception
     * @property {object} [options.exitOnUncaught=true] - Whether to exit process on uncaught exception thrown
     * @constructs Runable
     */
    constructor(name, options) {
        super(name, {
            logger: {
                "useMetaKey": "metadata",
                "level": "info",
                "transports": [
                    {
                        "type": "console",
                        "options": {                            
                            "format": winston.format.combine(winston.format.colorize(), winston.format.simple())
                        }
                    }
                ],
                ...(options && options.logger)
            },
            exitOnUncaught: true,
            ..._.omit(options, ['logger'])
        });        
    }

    /**
     * Start the app     
     * @returns {Promise}
     * @memberof Runable
     */
    async start_() {        
        this._initialize();

        process.on('exit', this._onExit);
        
        return super.start_();
    }

    /**
     * Stop the app
     * @returns {Promise}
     * @memberof Runable
     */
    async stop_() {
        if (this.started) {            
            if (this.libModules) {
                await eachAsync_(this.libModules, lib => lib.stop_());
                delete this.libModules;
            }
        }

        process.removeListener('exit', this._onExit);

        await super.stop_();

        await sleep_(0);

        this._uninitialize();
    }

    /**
     * Get the lib module
     * @param {string} libName 
     */
    getLib(libName) {
        if (!this.libModules) {
            throw new Error('"libModules" feature is required to access lib among modules.');
        }

        let libModule = this.libModules[libName];
        
        if (!libModule) {
            throw new Error(`Lib module [${libName}] not found.`);
        }

        return libModule;
    }

    /**
     * Require a module from the source path of a library module
     * @param {*} relativePath 
     */
    requireFromLib(libName, relativePath) {
        let libModule = this.getLib(libName);
        return libModule.require(relativePath);
    }

    /**
     * Register a loaded lib module
     * @param {LibModule} lib 
     */
    registerLib(lib) {
        if (!this.libModules) {
            this.libModules = {};
        }

        this.libModules[lib.name] = lib;
    }

    _initialize() {
        this._pwd = process.cwd();
        if (this.workingPath !== this._pwd) {                   
            process.chdir(this.workingPath);
        }      

        this._injectLogger();
        this._injectErrorHandlers(); 
    }

    _uninitialize() {
        const detach = true;
        this._injectErrorHandlers(detach);       
        this._injectLogger(detach);         

        process.chdir(this._pwd);
        delete this._pwd;
    }

    _injectLogger(detach) {
        if (detach) {
            this.log('verbose', 'Logger is detaching ...');

            if (!this._externalLogger) {
                this.logger.close();
            }

            delete this._externalLogger;
            delete this.logger;
            return;
        }

        if (this.options.logger instanceof Logger) {
            this.logger = this.options.logger;
            this._externalLogger = true;
        } else {        
            const loggerOpt = _.cloneDeep(this.options.logger)

            if (loggerOpt.transports) {                
                loggerOpt.transports = winstonFlight(winston, loggerOpt.transports);
            }

            this.logger = winston.createLogger(loggerOpt);   
        }
        
        this.log('verbose', 'Logger injected.');            
    }

    _injectErrorHandlers(detach) {
        if (detach) {            
            process.removeListener('warning', this._onWarning);
            if (this._onUncaughtException) {
                process.removeListener('uncaughtException', this._onUncaughtException);
                delete this._onUncaughtException;
            }
            this.log('verbose', 'Process-wide error handlers detached.');
            return;
        }

        if (!this.options.ignoreUncaught) {
            this._onUncaughtException = this._getOnUncaughtException(this.options.exitOnUncaught);
            process.on('uncaughtException', this._onUncaughtException);     
        }
        
        process.on('warning', this._onWarning);
        this.log('verbose', 'Process-wide error handlers injected.');            
    }
};

module.exports = Runable;