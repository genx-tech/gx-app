"use strict";

require("source-map-support/register");

exports.startWorker = require('./worker');
exports.startLoopWorker = require('./loopWorker');
exports.startQueueWorker = require('./queueWorker');
exports.startCLI = exports.startCommand = require('./command');
//# sourceMappingURL=index.js.map