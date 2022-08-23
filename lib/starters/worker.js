/**
 * Start a worker app
 * @param {Function} worker 
 * @param {object} [workerOptions] 
 * @property {string} [workerOptions.workerName]
 * @property {boolean} [workerOptions.dontStop] - Don't stop after worker done 
 * @property {Function} [workerOptions.initializer] 
 */
async function startWorker(worker, options) {
  const {
    workerName,
    dontStop,
    initializer,
    uninitializer,
    throwOnError,
    ...appOptions
  } = options || {};

  const App = require('..'); // create an app instance with custom configuration


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
    if (throwOnError) {
      throw error;
    }

    console.error(error);
    process.exit(1);
  }
}

module.exports = startWorker;
//# sourceMappingURL=worker.js.map