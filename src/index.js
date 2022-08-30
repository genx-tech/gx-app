const App = require('./App');

App.Literal = require('./enum/Literal');
App.Feature = require('./enum/Feature');
App.Runnable = require('./Runnable');
App.ServiceContainer = require('./ServiceContainer');
App.Helpers = require('./utils/Helpers');
App.Errors = require('@genx/error');
App.Starters = require('./starters');

module.exports = App;