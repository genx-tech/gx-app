"use strict";

/**
 * Enable db references
 * @module Feature_UseDb
 */

const path = require('path');
const { naming } = require('@genx/july');
const { InvalidConfiguration, InvalidArgument, ApplicationError } = require('@genx/error');
const Feature = require('../enum/Feature');
const Literal = require('../enum/Literal');

module.exports = {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    type: Feature.INIT,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} dbRefs - db reference settings     
     * @returns {Promise.<*>}
     */
    load_: async (app, dbRefs) => {
        const DbCache = {};
        
        app.db = (schemaName, originApp) => {
            if (!schemaName) {
                throw new InvalidArgument('Schema name is required.')
            }

            if (!originApp && DbCache[schemaName]) return DbCache[schemaName];

            let schemaInfo = dbRefs[schemaName];
            if (!schemaInfo) {
                throw new InvalidConfiguration(`Data source config for schema "${schemaName}" not found.`, app, { 'useDb': dbRefs, requestedSchema: schemaName });
            }

            if (!schemaInfo.fromLib && !schemaInfo.dataSource) {                
                throw new InvalidConfiguration('Missing "fromLib" or "dataSource".', app, { 'useDb': dbRefs, requestedSchema: schemaName });
            }

            let db;

            if (schemaInfo.fromLib) {
                if (originApp) {
                    throw new ApplicationError('Invalid usage of app.db()')
                }

                let refSchemaName = schemaInfo.schemaName || schemaName;
                let lib = (app.server || app).getLib(schemaInfo.fromLib);

                if (!lib.db) {
                    throw new InvalidConfiguration(`"useDb" feature is not enabled in lib module "${schemaInfo.fromLib}".`, app);
                }

                db = lib.db(refSchemaName, app);
            } else {
                let connector = app.getService(schemaInfo.dataSource);
                if (!connector) {
                    throw new InvalidConfiguration(`Data source [${schemaInfo.dataSource}] not found.`, app, `useDb.${schemaName}.dataSource`);
                }

                let i18n = app.getService('i18n') || app.__;
                let modelPath;

                if (app.options.modelPath) {
                    modelPath = app.toAbsolutePath(app.options.modelPath); 
                } else if (app.backendPath) {
                    modelPath = path.join(app.backendPath, Literal.MODELS_PATH);
                } else {
                    modelPath = app.toAbsolutePath(Literal.MODELS_PATH); 
                }

                const Db = require(path.join(modelPath, naming.pascalCase(schemaName)));
                db = new Db(originApp ?? app, connector, i18n);
            }           

            if (!originApp) {
                DbCache[schemaName] = db;            
            }

            return db;
        };       
        
        app.model = (schemaName, modelName) => {
            if (!modelName) {
                let [ s, m ] = schemaName.split('.');
                schemaName = s;
                modelName = m;                
            }
            
            return app.db(schemaName).model(modelName);
        };
    }
};