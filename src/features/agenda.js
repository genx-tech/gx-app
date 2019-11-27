"use strict";

/**
 * Enable bootstrap scripts
 * @module Feature_Agenda
 */


const Feature = require('../enum/Feature');
const { InvalidConfiguration } = require('../utils/Errors');
const { tryRequire } = require('../utils/Helpers');

module.exports = {

    /**
     * This feature is loaded at plugin stage
     * @member {string}
     */
    type: Feature.SERVICE,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} options - Options for the feature
     * @property {string} options.dataSource - The dataSource name
     * @returns {Promise.<*>}
     */
    load_: async function (app, options) {
        const Agenda = tryRequire('agenda');

        const { dataSource, collection, ...others } = options;

        if (!dataSource) {
            throw new InvalidConfiguration('Missing "dataSource" config.', app, 'agenda.dataSource');
        }

        (app.server || app).on('before:' + Feature.READY, (asyncHandlers) => {
            //wait for all plugins are loaded in case of referencing services from other web module
            let dbService = app.getService(dataSource);

            if (!dbService) {
                throw new InvalidConfiguration(`Data source "${dataSource}" not found.`, app, 'agenda.dataSource');
            }    

            if (dbService.driver !== 'mongodb') {
                throw new InvalidConfiguration(`Data source "${dataSource}" is not a mongodb.`, app, 'agenda.dataSource');
            }

            asyncHandlers.push((async () => {  
                let db = await dbService.connect_(); 
                
                let opts = { mongo: db, db: { collection: collection }, processEvery: '1 minute', ...others };                

                const agenda = new Agenda(opts);
                await new Promise(resolve => agenda.once('ready', resolve));
                app.registerService('agenda', agenda);
            })());            
        });        
    }
};