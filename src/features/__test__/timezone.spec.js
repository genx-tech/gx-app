'use strict';

const path = require('path');
const { fs } = require('@genx/sys');
const App = require('../../App');

const WORKING_DIR = path.resolve(__dirname, '../../../test/temp');

describe('feature:timezone', function () {
    let cliApp;

    before(async function () {
        fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', { 
            workingPath: WORKING_DIR
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                "timezone": "Australia/Sydney"
            };
        });

        return cliApp.start_();
    });

    after(async function () {        
        await cliApp.stop_();    
        fs.removeSync(WORKING_DIR);
    });

    describe('unittest:timezone', function () {
        it('timezone should work', function (done) {            
            let start = cliApp.now()
            let isoDT = start.toISO();
            (typeof isoDT).should.be.equal('string');

            setTimeout(() => {
                let duration = cliApp.now().diff(start).milliseconds;
                duration.should.be.above(99);
                duration.should.be.below(200);
                done();
            }, 100)
        });
    });
});