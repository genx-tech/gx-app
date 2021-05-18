'use strict';

const path = require('path');
const { fs } = require('@genx/sys');
const App = require('../../App');

const WORKING_DIR = path.resolve(__dirname, '../../../test/temp');

describe('feature:objectStore', function () {
    let cliApp;

    before(async function () {
        fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', { 
            workingPath: WORKING_DIR
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                "objectStore": {
                    "cachedObject": (app) => app.name
                }
            };
        });

        return cliApp.start_();
    });

    after(async function () {        
        await cliApp.stop_();    
        fs.removeSync(WORKING_DIR);
    });

    describe('unittest:objectStore', function () {
        it('object store should work', function () {            
            should.exists(cliApp.store);
            let obj = cliApp.store.ensureOne('cachedObject');
            should.exists(obj);

            obj.should.be.equal('test server');
        });
    });
});