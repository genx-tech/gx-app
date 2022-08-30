"use strict";

const ServiceContainer = require('./ServiceContainer');
const Runnable = require('./Runnable');

/**
 * Cli app.
 * @class
 * @mixes {Runnable}
 * @extends {ServiceContainer}     
 */
class App extends Runnable(ServiceContainer) {
    constructor(name, options) {
        super(name || 'cli', options);
    }
}

module.exports = App;