"use strict";

require("source-map-support/register");

const ServiceContainer = require('./ServiceContainer');

const Runable = require('./Runable');

class App extends Runable(ServiceContainer) {
  constructor(name, options) {
    super(name || 'cli', options);
  }

}

module.exports = App;
//# sourceMappingURL=App.js.map