const App = require('./App');
const appStarters = require('./apps');

Object.assign(App, appStarters);

App.Runable = require('./Runable');
App.ServiceContainer = require('./ServiceContainer');
App.Helpers = require('./utils/Helpers');
App.Errors = require('./utils/Errors');

module.exports = App;