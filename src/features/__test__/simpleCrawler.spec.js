'use strict';

const path = require('path');
const Util = require('rk-utils');
const App = require('../../../lib/App');

const WORKING_DIR = path.resolve(__dirname, '../../../test/temp');

describe('feature:simpleCrawler', function () {
    let cliApp;

    before(async function () {
        Util.fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', { 
            workingPath: WORKING_DIR
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                "simpleCrawler": {      
                    "parser": "cheerio"              
                }
            };
        });

        return cliApp.start_();
    });

    after(async function () {        
        await cliApp.stop_();    
        Util.fs.removeSync(WORKING_DIR);
    });

    describe('unittest:simpleCrawler', function () {
        it('microsoft.com', async function () {            
            let crawler = cliApp.getService('simpleCrawler');

            should.exist(crawler);
            
            let html = await crawler.get_('http://www.microsoft.com');

            (html('title').text().indexOf('Microsoft') > -1).should.be.ok();
        });
    });
});