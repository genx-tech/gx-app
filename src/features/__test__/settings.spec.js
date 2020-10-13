'use strict';

const path = require('path');
const Util = require('rk-utils');
const App = require('../../App');

const WORKING_DIR = path.resolve(__dirname, '../../../test/temp');

describe('feature:settings', function () {
    let cliApp;

    before(async function () {
        Util.fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', { 
            workingPath: WORKING_DIR
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                "settings": {
                    "key": 1,
                    "env:development": {
                        "key": 2
                    }
                }
            };
        });

        return cliApp.start_();
    });

    after(async function () {        
        await cliApp.stop_();    
        Util.fs.removeSync(WORKING_DIR);
    });

    it('unittest:settings env', function () {
        cliApp.settings.key.should.be.exactly(2);
    });
});