const Feature = require('../../../../src/enum/Feature');

module.exports = {
    type: Feature.PLUGIN,

    load_: function (app, options) {
        app.plugin = options.item;
    }
};