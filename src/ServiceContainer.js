"use strict";

const ConfigLoader = require("@genx/config");
const JsonConfigProvider = require("@genx/config/lib/JsonConfigProvider");
const { _, pushIntoBucket, eachAsync_ } = require("@genx/july");
const { fs, tryRequire: _tryRequire } = require("@genx/sys");
const path = require("path");
const EventEmitter = require("events");
const winston = require("winston");

const Feature = require("./enum/Feature");
const Literal = require("./enum/Literal");

/**
 * Service container class.
 * @class
 * @extends EventEmitter
 */
class ServiceContainer extends EventEmitter {
    logError = (error, message) => {
        return this.logException("error", error, message);
    };

    logErrorAsWarning = (error, message) => {
        return this.logException("warn", error, message);
    };

    /**
     * @param {string} name - The name of the container instance.
     * @param {object} [options] - Container options
     * @property {string} [options.env] - Environment, default to process.env.NODE_ENV
     * @property {string} [options.workingPath] - App's working path, default to process.cwd()
     * @property {string} [options.configPath] - App's config path, default to "conf" under workingPath
     * @property {string} [options.configName] - App's config basename, default to "app"
     * @property {string} [options.disableEnvAwareConfig=false] - Don't use environment-aware config
     * @property {array} [options.allowedFeatures] - A list of enabled feature names
     * @property {boolean} [options.loadConfigFromOptions=false] - Whether to load config from passed-in options
     * @property {object} [options.config] - Config in options, used only when loadConfigFromOptions
     */
    constructor(name, options) {
        super();

        /**
         * Name of the app
         * @member {object}
         **/
        this.name = name;

        /**
         * App options
         * @member {object}
         */
        this.options = Object.assign(
            {
                //... default options
            },
            options
        );

        /**
         * Environment flag
         * @member {string}
         */
        this.env = this.options.env || process.env.NODE_ENV || "development";

        /**
         * Working directory of this cli app
         * @member {string}
         */
        this.workingPath = this.options.workingPath ? path.resolve(this.options.workingPath) : process.cwd();

        /**
         * Config path
         * @member {string}
         */
        this.configPath = this.toAbsolutePath(this.options.configPath || Literal.DEFAULT_CONFIG_PATH);

        /**
         * Config basename
         * @member {string}
         */
        this.configName = this.options.configName || Literal.APP_CFG_NAME;
    }

    /**
     * Start the container.
     * @fires ServiceContainer#configLoaded
     * @fires ServiceContainer#ready
     * @returns {Promise.<ServiceContainer>}
     */
    async start_() {
        this.log("verbose", `Starting app [${this.name}] ...`);

        this._featureRegistry = {
            //firstly look up "features" under current working path, and then try the builtin features path
            "*": this._getFeatureFallbackPath(),
        };
        /**
         * Loaded features, name => feature object
         * @member {object}
         */
        this.features = {};
        /**
         * Loaded services
         * @member {object}
         */
        this.services = {};

        if (this.options.loadConfigFromOptions) {
            this.config = this.options.config;
        } else {
            /**
             * Configuration loader instance
             * @member {ConfigLoader}
             */
            this.configLoader = this.options.disableEnvAwareConfig
                ? new ConfigLoader(new JsonConfigProvider(path.join(this.configPath, this.configName + ".json")), this)
                : ConfigLoader.createEnvAwareJsonLoader(this.configPath, this.configName, this.env, this);

            await this.loadConfig_();
        }

        /**
         * Config loaded event.
         * @event ServiceContainer#configLoaded
         */
        this.emit("configLoaded");

        if (_.isEmpty(this.config)) {
            throw Error("Empty configuration. Nothing to do! Config path: " + this.configPath);
        }

        await this._loadFeatures_();

        /**
         * App ready
         * @event ServiceContainer#ready
         */
        this.emit("ready");

        /**
         * Flag showing the app is started or not.
         * @member {bool}
         */
        this.started = true;

        return this;
    }

    /**
     * Stop the container
     * @fires ServiceContainer#stopping
     * @returns {Promise.<ServiceContainer>}
     */
    async stop_() {
        /**
         * App stopping
         * @event ServiceContainer#stopping
         */
        await this.emitAsync_("stopping");

        this.log("verbose", `Stopping app [${this.name}] ...`);

        this.started = false;

        delete this.services;
        delete this.features;
        delete this._featureRegistry;

        delete this.config;
        delete this.configLoader;

        await this.emitAsync_("stopped");

        this.removeAllListeners();
    }

    /**
     * @returns {ServiceContainer}
     */
    async loadConfig_() {
        let configVariables = this._getConfigVariables();

        /**
         * App configuration
         * @member {object}
         */
        this.config = await this.configLoader.load_(configVariables);

        return this;
    }

    /**
     * Translate a relative path of this app module to an absolute path
     * @param {array} args - Array of path parts
     * @returns {string}
     */
    toAbsolutePath(...args) {
        if (args.length === 0 || args[0] == null) {
            return this.workingPath;
        }

        return path.resolve(this.workingPath, ...args);
    }

    tryRequire(pkgName) {
        return _tryRequire(pkgName, this.workingPath);
    }

    /**
     * Register a service
     * @param {string} name
     * @param {object} serviceObject
     * @param {boolean} override
     */
    registerService(name, serviceObject, override) {
        if (name in this.services && !override) {
            throw new Error('Service "' + name + '" already registered!');
        }

        this.services[name] = serviceObject;
        this.log("verbose", `Service "${name}" registered.`);
        return this;
    }

    /**
     * Check whether a service exists
     * @param {*} name
     * @returns {boolean}
     */
    hasService(name) {
        return name in this.services;
    }

    /**
     * Get a service from module hierarchy
     * @param name
     * @returns {object}
     */
    getService(name) {
        return this.services[name];
    }

    /**
     * Check whether a feature is enabled in the app.
     * @param {string} feature
     * @returns {bool}
     */
    enabled(feature) {
        return this.features.hasOwnProperty(feature);
    }

    /**
     * Add more or overide current feature registry
     * @param {object} registry
     */
    addFeatureRegistry(registry) {
        // * is used as the fallback location to find a feature
        if (registry.hasOwnProperty("*")) {
            pushIntoBucket(this._featureRegistry, "*", registry["*"]);
        }

        Object.assign(this._featureRegistry, _.omit(registry, ["*"]));
    }

    /**
     * Default log method, may be override by loggers feature
     * @param {string} - Log level
     * @param {string} - Log message
     * @param {...object} - Extra meta data
     * @returns {ServiceContainer}
     */
    log(level, message, ...rest) {
        this.logger && this.logger.log(level, message, ...rest);
        return this;
    }

    /**
     * Helper method to log an exception
     * @param {*} level
     * @param {*} error
     * @param {*} summary
     * @returns {ServiceContainer}
     */
    logException(level, error, summary) {
        this.log(
            level,
            (summary ? summary + "\n" : "") + error.message,
            _.pick(error, ["name", "status", "code", "info", "stack", "request"])
        );
        return this;
    }

    /**
     * Replace the default logger set on creation of the app.
     * @param {Logger} logger
     * @memberof ServiceContainer
     */
    replaceLogger(logger) {
        if (logger) {
            assert: !this._loggerBackup;

            this._loggerBackup = this.logger;
            this._externalLoggerBackup = this._externalLogger;

            this.logger = logger;
            this._externalLogger = true;

            this.log("verbose", "A new app logger attached.");
        } else {
            this.logger = this._loggerBackup;
            this._externalLogger = this._externalLoggerBackup;

            delete this._loggerBackup;
            delete this._externalLoggerBackup;

            this.log("verbose", "The current app logger is dettached.");
        }
    }

    _getConfigVariables() {
        const processInfo = {
            env: process.env,
            arch: process.arch,
            argv: process.argv,
            cwd: process.cwd(),
            pid: process.pid,
            platform: process.platform,
        };

        return {
            app: this,
            log: winston,
            env: this.env,
            process: processInfo
        };
    }

    _getFeatureFallbackPath() {
        return [
            path.resolve(__dirname, Literal.FEATURES_PATH),
            this.options.featuresPath
                ? this.toAbsolutePath(this.options.featuresPath)
                : this.toAbsolutePath(Literal.FEATURES_PATH),
        ];
    }

    async emitAsync_(event) {
        let asyncHandlers = [];
        this.emit(event, asyncHandlers);
        if (asyncHandlers.length > 0) {
            await Promise.all(asyncHandlers);
        }
    }

    /**
     * Load features
     * @private
     * @returns {bool}
     */
    async _loadFeatures_() {
        // run config stage separately first
        let configStageFeatures = [];

        // load features
        _.forOwn(this.config, (featureOptions, name) => {
            if (this.options.allowedFeatures && this.options.allowedFeatures.indexOf(name) === -1) {
                //skip disabled features
                return;
            }

            let feature;
            try {
                feature = this._loadFeature(name);
            } catch (err) {
                //ignore the first trial                
            }

            if (feature && feature.type === Feature.CONF) {
                configStageFeatures.push([name, feature.load_, featureOptions]);
                delete this.config[name];
            }
        });

        if (configStageFeatures.length > 0) {
            //configuration features will be overrided by newly loaded config
            configStageFeatures.forEach(([name]) => {
                delete this.config[name];
            });

            await this._loadFeatureGroup_(configStageFeatures, Feature.CONF);

            //reload all features if any type of configuration feature exists
            return this._loadFeatures_();
        }

        let featureGroups = {
            [Feature.INIT]: [],
            [Feature.SERVICE]: [],
            [Feature.PLUGIN]: [],
            [Feature.READY]: [],
        };

        // load features
        _.forOwn(this.config, (featureOptions, name) => {
            if (this.options.allowedFeatures && this.options.allowedFeatures.indexOf(name) === -1) {
                //skip disabled features
                return;
            }

            let feature = this._loadFeature(name);

            if (!(feature.type in featureGroups)) {
                throw new Error(`Invalid feature type. Feature: ${name}, type: ${feature.type}`);
            }

            featureGroups[feature.type].push([name, feature.load_, featureOptions]);
        });

        return eachAsync_(featureGroups, (group, level) => this._loadFeatureGroup_(group, level));
    }

    async _loadFeatureGroup_(featureGroup, groupLevel) {
        await this.emitAsync_("before:" + groupLevel);
        this.log("verbose", `Loading "${groupLevel}" feature group ...`);

        await eachAsync_(featureGroup, async ([name, load_, options]) => {
            await this.emitAsync_("before:load:" + name);
            this.log("verbose", `Loading feature "${name}" ...`);

            await load_(this, options, name);
            this.features[name].loaded = true;

            this.log("verbose", `Feature "${name}" loaded. [OK]`);

            await this.emitAsync_("after:load:" + name);
        });
        this.log("verbose", `Finished loading "${groupLevel}" feature group. [OK]`);

        await this.emitAsync_("after:" + groupLevel);
    }

    /**
     * Load a feature object by name.
     * @private
     * @param {string} feature
     * @returns {object}
     */
    _loadFeature(feature) {
        let featureObject = this.features[feature];
        if (featureObject) return featureObject;

        let featurePath;

        if (this._featureRegistry.hasOwnProperty(feature)) {
            //load by registry entry
            let loadOption = this._featureRegistry[feature];

            if (Array.isArray(loadOption)) {
                if (loadOption.length === 0) {
                    throw new Error(`Invalid registry value for feature "${feature}".`);
                }

                featurePath = loadOption[0];
                featureObject = this.tryRequire(featurePath);

                if (loadOption.length > 1) {
                    //one module may contains more than one feature
                    featureObject = _.get(featureObject, loadOption[1]);
                }
            } else {
                featurePath = loadOption;
                featureObject = this.tryRequire(featurePath);
            }
        } else {
            //load by fallback paths
            let searchingPath = this._featureRegistry["*"];

            //reverse fallback stack
            let found = _.findLast(searchingPath, (p) => {
                featurePath = path.join(p, feature + ".js");
                return fs.existsSync(featurePath);
            });

            if (!found) {
                throw new Error(`Don't know where to load feature "${feature}".`);
            }

            featureObject = require(featurePath);
        }

        if (!Feature.validate(featureObject)) {
            throw new Error(`Invalid feature object loaded from "${featurePath}".`);
        }

        this.features[feature] = featureObject;
        return featureObject;
    }
}

module.exports = ServiceContainer;
