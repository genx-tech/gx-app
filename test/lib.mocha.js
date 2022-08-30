'use strict';

/**
 * Module dependencies.
 */

const CliApp = require('../src');

const WORKING_DIR = 'test/fixtures/lib-test';

describe('custom features', function () {    
    let cliApp;

    before(async function () {
        cliApp = new CliApp('test', { 
            workingPath: WORKING_DIR
        });

        return cliApp.start_();
    });

    after(async function () {
        await cliApp.stop_();       
    });

    it('dummy', function () {
        const dummy = cliApp.getService('dummy/dummy');
        dummy.key.should.be.eql('hello');
    });
});