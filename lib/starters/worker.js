"use strict";

require("source-map-support/register");

async function startWorker(worker, options) {
  const {
    workerName,
    dontStop,
    initializer,
    uninitializer,
    ...appOptions
  } = options || {};

  const App = require('..');

  let app = new App(workerName || 'worker', appOptions);

  try {
    await app.start_();

    if (initializer) {
      await initializer(app);
    }

    await worker(app);

    if (!dontStop) {
      await app.stop_();
    }

    if (uninitializer) {
      await uninitializer();
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

module.exports = startWorker;