'use strict';

const path = require('path');
const { fs } = require('@genx/sys');
const App = require('../../App');

const WORKING_DIR = path.resolve(__dirname, '../../../test/temp');

describe('feature:restClient', function () {
    let cliApp;

    before(async function () {
        fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', { 
            workingPath: WORKING_DIR
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                "restClient": "https://nodejs.org",
                "serviceGroup": {
                    "restClient": {
                        "nodejs": "https://nodejs.org"
                    }
                }
            };
        });

        return cliApp.start_();
    });

    after(async function () {        
        await cliApp.stop_();    
        fs.removeSync(WORKING_DIR);
    });

    it('get 1', async function () {            
        let restClient = cliApp.getService('restClient');

        should.exist(restClient);

        let page = await restClient.get('en');

        page.startsWith('<!DOCTYPE html>').should.be.ok();       
        
    });

    it('get 2', async function () {            
        let restClient = cliApp.getService('restClient-nodejs');

        should.exist(restClient);

        let page = await restClient.get('en');

        page.startsWith('<!DOCTYPE html>').should.be.ok();       
        
    });
});