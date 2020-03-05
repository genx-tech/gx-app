"use strict";

const Util = require('rk-utils');
const { _, Promise } = Util;

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
    _onUncaughtException = err => {
        let waitForLogging = setTimeout(() => {
            process.exit(1);
        }, 1000);

        this.log('error', err, () => {
            clearTimeout(waitForLogging);
            process.exit(1);
        });
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
        process.removeListener('exit', this._onExit);

        await super.stop_();

        return new Promise((resolve, reject) => {
            //deferred execution
            setTimeout(() => {
                this._uninitialize();

                resolve(this);
            }, 0);
        });
    }

    /**
     * Replace the default logger set on creation of the app.
     * @param {Logger} logger 
     * @memberof Runable
     */
    replaceLogger(logger) {
        if (logger) {
            assert: !this._loggerBackup;

            this._loggerBackup = this.logger;
            this._externalLoggerBackup = this._externalLogger;
            
            this.logger = logger;
            this._externalLogger = true;

            this.log('verbose', 'A new app logger attached.');
        } else {
            //replace back
            assert: this._loggerBackup;

            this.logger = this._loggerBackup;
            this._externalLogger = this._externalLoggerBackup;

            delete this._loggerBackup;
            delete this._externalLoggerBackup;

            this.log('verbose', 'The current app logger is dettached.');
        }
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

        let loggerOpt = this.options.logger;

        if (loggerOpt instanceof Logger) {
            this.logger = loggerOpt;
            this._externalLogger = true;
        } else {
            if (loggerOpt.transports) {
                loggerOpt.transports = winstonFlight(winston, loggerOpt.transports);
            }

            this.logger = winston.createLogger(loggerOpt);   
        }
        
        this.log('verbose', 'Logger injected.');            
    }

    _injectErrorHandlers(detach) {
        if (detach) {
            this.log('verbose', 'Process-wide error handlers are detaching ...');
            process.removeListener('warning', this._onWarning);
            process.removeListener('uncaughtException', this._onUncaughtException);
            return;
        }

        process.on('uncaughtException', this._onUncaughtException); 
        process.on('warning', this._onWarning);
        this.log('verbose', 'Process-wide error handlers injected.');            
    }
};

module.exports = Runable;