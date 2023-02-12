'use strict';

const path = require('path');
const { fs } = require('@genx/sys');
const App = require('../../App');

const WORKING_DIR = path.resolve(__dirname, '../../../test/temp');

describe('feature:dataSource', function () {
    let cliApp;

    before(async function () {
        fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', { 
            workingPath: WORKING_DIR,
            logger: {
                level: 'debug'
            },
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                "dataSource": {
                    "mysql": {
                        "local": {
                            "connection": "mysql://root:root@localhost/gx-test-db"
                        }
                    }
                }
            };
        });

        await cliApp.start_();

        const mysql = cliApp.getService('mysql.local');
        
        await mysql.execute_('CREATE DATABASE IF NOT EXISTS ??', 
            [ 'gx-test-db' ], 
            { createDatabase: true }
        );        
    });

    after(async function () {        
        await cliApp.stop_();    
        fs.removeSync(WORKING_DIR);
    });

    it('data source should work', async function () {            
        let mysql = cliApp.getService('mysql.local');
        should.exist(mysql);

        let pinged = await mysql.ping_();
        pinged.should.be.ok();   
    });
});