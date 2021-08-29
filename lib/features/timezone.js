"use strict";

require("source-map-support/register");

const Feature = require('../enum/Feature');

const Literal = require('../enum/Literal');

module.exports = {
  type: Feature.INIT,
  load_: (app, timezone) => {
    if (typeof timezone !== 'string') {
      throw new Error('Timezone value should be a string.');
    }

    let Luxon = app.tryRequire('luxon');
    const {
      DateTime
    } = Luxon;

    app.now = () => DateTime.local().setZone(timezone || Literal.DEFAULT_TIMEZONE);

    app.__ = { ...app.__,
      timezone
    };
  }
};