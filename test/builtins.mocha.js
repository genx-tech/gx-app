'use strict';

/**
 * Module dependencies.
 */

const { glob } = require('@genx/sys');
const sh = require('shelljs');
const path = require('path');
const CliApp = require('../src');

const WORKING_DIR = 'test/fixtures/builtin-test';
const APP_NAME = 'test';

describe('builtin features', function () {    
    let cliApp;

    before(async function () {
        cliApp = new CliApp(APP_NAME, { 
            workingPath: WORKING_DIR
        });

        return cliApp.start_();
    });

    after(async function () {        
        await cliApp.stop_();        
        sh.rm('-rf', path.resolve(__dirname, 'fixtures/builtin-test/*.log'));
    });

    it('app version', function () {
        should.exist(cliApp.version);
        cliApp.version.should.equal('1.0');   
    });

    it('bootstrap mark should be set', function () {
        should.exist(cliApp.bootstrapInfo);
        cliApp.bootstrapInfo.should.equal('for test only');        
    });

    it('setting should be loaded', function () {
        should.exist(cliApp.settings);
        should.exist(cliApp.settings.parser);
        should.exist(cliApp.settings.parser.lib);
        cliApp.settings.parser.lib.should.equal('override');        
    });

    it('show usage', function () {
        const capcon = require('capture-console');
 
        let stdout = capcon.captureStdout(function scope() {
            cliApp.commandLine.showUsage();
        });

        stdout.should.equal('This is the program banner v1.0\n\nUsage: cli-worker <target file> [options]\n\nOptions:\n  -e, --env, --environment\n    Target environment\n    default: development\n\n  -v, --version\n    Show version number\n    default: false\n\n  -?, --help\n    Show usage message\n    default: false\n\n\n');                
    });

    it('logger services', async function () {
        let tracer = cliApp.getService('logger.trace');
        should.exist(tracer);

        tracer.log('info', 'writing logs to tracer with meta object', { data: 'object' });        
        
        let logFiles = await glob(cliApp.toAbsolutePath('trace-*.log'));
        logFiles.length.should.greaterThan(0);

        let biLogger = cliApp.getService('logger.bi');
        should.exist(biLogger);

        biLogger.log('info', 'log message', { event: 'test', data: [ 'a', 'b' ] });

        return new Promise((resolve, reject) => {
            setTimeout(() => {            
                let mongoUrl = process.env.USER_MONGODB_URL || 'mongodb://root:root@localhost:27017/bi-logs?authSource=admin';
                const MongoClient = require('mongodb').MongoClient;      
                
                console.log(mongoUrl);
                
                let client = new MongoClient(mongoUrl, { useNewUrlParser: true });

                // Use connect method to connect to the server
                client.connect(function(err) {
                    if (err) return reject(err);
                
                    let db = client.db();
                    let collection = db.collection('log');

                    collection.findOne({ "meta.event": "test" }, function(err2, doc) {
                        if (err2) {
                            console.error(err2);
                            return reject(err2);
                        }

                        console.log(doc);
                        
                        should.exist(doc);
                        should.exist(doc.meta);
                        should.exist(doc.meta.data);
                        doc.meta.data.length.should.be.exactly(2);

                        collection.deleteOne({ _id: doc._id }, function (err3, res) {
                            if (err3) return reject(err3);

                            res.deletedCount.should.be.exactly(1);

                            client.close(() => {                            
                                collection = null;
                                db = null;
                                client = null;                            
                                resolve();
                            });       
                        });         
                    });            
                });
            }, 300);        
        });
    });
});