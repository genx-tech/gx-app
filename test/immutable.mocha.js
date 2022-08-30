'use strict';

/**
 * Module dependencies.
 */

const CliApp = require('../src');
const deepFreeze = require('deep-freeze');

const WORKING_DIR = 'test/fixtures/builtin-test';
const APP_NAME = 'test';

describe('immutable options', function () {  
    it('start and stop', async function () {
        const options = deepFreeze({ 
            workingPath: WORKING_DIR,
            logger: {
                level: 'debug',
                "transports": [
                    {
                        "type": "console"                        
                    }
                ]
            }
        });

        const cliApp = new CliApp(APP_NAME, options);

        cliApp.options = deepFreeze(cliApp.options);

        await cliApp.start_();   
        
        await cliApp.stop_();        
    });    
});