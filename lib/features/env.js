"use strict";
/**
 * Enable app customized env variables
 * @module Feature_Env
 */

const Feature = require('../enum/Feature');

module.exports = {
  /**
   * This feature is loaded at init stage
   * @member {string}
   */
  type: Feature.INIT,

  /**
   * Load the feature
   * @param {App} app - The cli app module object
   * @param {object} envSettings - Customized env settings
   * @returns {Promise.<*>}
   */
  load_: function (app, envSettings) {
    Object.assign(process.env, envSettings);
  }
};
//# sourceMappingURL=env.js.map