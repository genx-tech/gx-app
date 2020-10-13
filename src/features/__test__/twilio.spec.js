'use strict';

const path = require('path');
const Util = require('rk-utils');
const App = require('../../App');

const WORKING_DIR = path.resolve(__dirname, '../../../test/temp');

const TO_NUMBER = null;
const ACCOUNT_SID = null;
const AUTH_TOKEN = null;
const FROM_NUMBER = null;

describe.skip('feature:twilio', function () {
    let cliApp;

    before(async function () {
        Util.fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', { 
            workingPath: WORKING_DIR
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                "twilio": {
                    "accountSid": ACCOUNT_SID, 
                    "authToken": AUTH_TOKEN, 
                    "from": FROM_NUMBER,
                }
            };
        });

        return cliApp.start_();
    });

    after(async function () {        
        await cliApp.stop_();    
        Util.fs.removeSync(WORKING_DIR);
    });

    it('get service', async function () {            
        let twilio = cliApp.getService('twilio');
        should.exist(twilio);

        const msg = await twilio.sendSms_(TO_NUMBER, 'Hello twilio.');
        console.log(msg);
    });
});