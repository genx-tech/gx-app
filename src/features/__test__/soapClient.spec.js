'use strict';

const path = require('path');
const { fs } = require('@genx/sys');
const App = require('../../App');

const WORKING_DIR = path.resolve(__dirname, '../../../test/temp');

describe('feature:soapClient', function () {
    let cliApp;

    before(async function () {
        fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', { 
            workingPath: WORKING_DIR
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                "soapClient": {
                    wsdlUrl: 'http://www.dneonline.com/calculator.asmx?WSDL'
                }
            };
        });

        return cliApp.start_();
    });

    after(async function () {        
        await cliApp.stop_();    
        fs.removeSync(WORKING_DIR);
    });

    it('abn lookup', async function () {            
        let soapClient = cliApp.getService('soapClient');

        should.exist(soapClient);

        let methods = await soapClient.listMethods_();

        methods.should.have.keys('Calculator');
        
        let body = await soapClient.call_('Add', {
            intA: 10,
            intB: 20
        });

        body.should.have.keys('AddResult');

        body.AddResult.should.be.exactly(30);
    });
});