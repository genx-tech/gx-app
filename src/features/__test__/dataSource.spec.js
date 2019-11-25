'use strict';

const path = require('path');
const Util = require('rk-utils');
const App = require('../../../lib/App');

const WORKING_DIR = path.resolve(__dirname, '../../../test/temp');

describe('feature:dataSource', function () {
    let cliApp;

    before(async function () {
        Util.fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', { 
            workingPath: WORKING_DIR
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                "dataSource": {
                    "mysql": {
                        "local": "mysql://root:root@localhost"
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

    describe('unittest:dataSource', function () {
        it('data source should work', async function () {            
            let mysql = cliApp.getService('mysql.local');
            should.exist(mysql);

            let pinged = await mysql.ping_();
            pinged.should.be.ok();
        });
    });
});