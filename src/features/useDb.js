"use strict";

/**
 * Enable db references
 * @module Feature_UseDb
 */

const path = require('path');
const { _, pascalCase } = require('rk-utils');
const { InvalidConfiguration } = require('../utils/Errors');
const Feature = require('../enum/Feature');
const Literal = require('../enum/Literal');

const DbCache = {};

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
        app.db = (schemaName) => {
            if (DbCache[schemaName]) return DbCache[schemaName];

            let schemaInfo = dbRefs[schemaName];
            if (!schemaInfo || (!schemaInfo.fromLib && !schemaInfo.dataSource)) {
                
                throw new InvalidConfiguration('Missing "lib" or "dataSource".', app, `useDb.${schemaName}`);
            }
            
            let connector = app.getService(schemaInfo.dataSource);
            if (!connector) {
                throw new InvalidConfiguration(`Data source [${schemaInfo.dataSource}] not found.`, app, `useDb.${schemaName}.dataSource`);
            }

            let i18n = app.getService('i18n') || app.__;
            let modelPath;

            modelPath = app.toAbsolutePath(app.options.modelsPath || Literal.MODELS_PATH); 

            const Db = require(path.join(modelPath, pascalCase(schemaName)));
            let db = new Db(app, connector, i18n);                   

            DbCache[schemaName] = db;            

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