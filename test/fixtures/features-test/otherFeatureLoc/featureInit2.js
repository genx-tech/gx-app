const Feature = require('../../../../src/enum/Feature');

module.exports = {
    type: Feature.INIT,

    load_: function (app, options) {
        app.init2 = options;
    }
};