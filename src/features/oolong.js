"use strict";

/**
 * Enable oolong DSL
 * @module Feature_Oolong
 */

const path = require('path');
const { _, Promise, pascalCase } = require('rk-utils');
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
     * @param {object} oolong - Oolong settings
     * @property {bool} [oolong.logSqlStatement] - Flag to turn on sql debugging log
     * @returns {Promise.<*>}
     */
    load_: async (app, oolong) => {
        app.oolong = oolong;

        if (!oolong.schemaDeployment) {
            throw new Error('Missing "schemaDeployment" in oolong config.');
        }

        app.db = (schemaName) => {
            if (DbCache[schemaName]) return DbCache[schemaName];

            let schemaInfo = oolong.schemaDeployment[schemaName];
            if (!schemaInfo || !schemaInfo.dataSource) {
                
                throw new Error('Missing "dataSource" in schemaDeployment section of oolong config.');
            }

            let connector = app.getService(schemaInfo.dataSource);
            if (!connector) {
                throw new Error('Invalid data source.');
            }

            let i18n = app.getService('i18n') || app.__;

            let modelPath;

            if (oolong.modelDir) {
                modelPath = app.toAbsolutePath(oolong.modelDir);
            } else if (app.backendPath) {
                modelPath = path.join(app.backendPath, Literal.MODELS_PATH);
            } else {
                modelPath = app.toAbsolutePath(Literal.MODELS_PATH); 
            }

            const Db = require(path.join(modelPath, pascalCase(schemaName)));
            let db = new Db(connector, i18n);
            db.app = app;

            DbCache[schemaName] = db;            

            return db;
        };       
        
        app.model = (modelFullName) => {
            let [ schemaName, modelName ] = modelFullName.split('.');
            return app.db(schemaName).model(modelName);
        };
    }
};