const Feature = require('../enum/Feature');
const { tryRequire } = require('../utils/Helpers');
const Imap = tryRequire('imap');
const { _, waitUntil_, Promise } = require('rk-utils');

class ImapClient {
    constructor(app, name, config) {        
        this.app = app;
        this.name = name;        
        this.config = config;

        this.closing = false;
        this.connecting = false;

        let { autoReconnect, ...imapConfig } = config;         

        this.imap = new Imap(imapConfig);

        this.imap.on('error', error => { 
            this.app.logError(error);
        });

        this.imap.on('alert', message => {
            this.app.log('warning', `The imap server [${this.name}] issues an alert. Message: ${message}`);
        });

        this.imap.on('ready', () => {
            this.ready = true;
            this.connecting = false;
            this.app.log('info', `The imap server [${this.name}] is ready.`);
        });

        this.imap.on('close', () => {    
            this.ready = false; 
            this.app.log('info', `The connection to imap server [${this.name}] is closed.`);           
        });

        this.imap.on('end', () => {
            this.ready = false;    
            this.app.log('info', `The imap server [${this.name}] is ended.`);

            if (autoReconnect && !this.closing && !this.connecting) {
                this._connect();
            }
        });

        //promisify imap functions
        let options = { context: this.imap };

        [
            'openBox', 'closeBox', 'addBox', 'delBox', 'renameBox', 'subscribeBox', 'unsubscribeBox',
            'status', 'getBoxes', 'getSubscribedBoxes', 'expunge', 'append',
            //All functions below have sequence number-based counterparts that 
            //can be accessed by using the 'seq' namespace of the imap connection's 
            //instance (e.g. conn.seq.search() returns sequence number(s) instead of UIDs, 
            //conn.seq.fetch() fetches by sequence number(s) instead of UIDs, etc):
            'search', 'copy', 'move', 'addFlags', 'delFlags', 'setFlags', 'addKeywords', 'delKeywords', 'setKeywords',

            //gmail extention
            'setLabels', 'addLabels', 'delLabels'
        ].forEach(methodName => {
            this[methodName + '_'] = Promise.promisify(this.imap[methodName], options);
        });

        this._connect();
    }

    _connect() {
        this.connecting = true;
        this.imap.connect();
    }

    async waitForReady_(interval = 500, maxRound = 30) {
        return waitUntil_(() => this.ready, interval, maxRound);
    }

    async connect_() {
        if (!this.ready) {
            if (!this.connecting) {
                this._connect();
            }

            return this.waitForReady_();
        }

        return this.ready;
    }

    async close_() {      
        if (this.ready) {  
            this.closing = true;
            this.imap.end();

            let ended = await waitUntil_(() => !this.ready, 100, 300);

            if (!ended) {
                this.imap.destroy();
            }
        }
    }  
    
    serverSupports(caps) {
        return this.imap.serverSupports(caps);
    }

    /**
     * @returns {object} Map of seqno to message
     */
    async fetch_(source, fetchOptions) {
        let imapFetch = this.imap.fetch(source, fetchOptions);

        let messages = [];

        imapFetch.on('message', (msg, seqno) => {            
            let attributes;
            let body = [];

            msg.on('body', (stream, info) => {
                body.push({ section: info.which, size: info.size, stream });
            });

            msg.once('attributes', (attrs) => {
                attributes = attrs;
            });

            msg.once('end', () => {
                messages.push({ seqno, attributes, body });
            });     
        });

        return await new Promise((resolve, reject) => {
            imapFetch.on('end', () => {
                resolve(messages);
            });

            imapFetch.on('error', (error) => {
                reject(error);
            });
        });               
    }
}

module.exports = {

    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    type: Feature.SERVICE,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of rest clients    
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings) {
        _.forOwn(settings, (cfg, name) => {
            let client = new ImapClient(app, name, cfg);
            app.registerService(`imap.${name}`, client);

            app.on('stopping', (elegantStoppers) => {
                elegantStoppers.push(client.close_());                
            });
        });
    }
};
