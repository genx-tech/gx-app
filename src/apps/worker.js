function startWorker(workingPath, configName, worker, workerName, dontStop) {
    const App = require('..');

    // create an app instance with custom configuration
    let app = new App(workerName || 'worker', {
        workingPath,
        configName
    });

    let appStarted = app.start_().then(worker);
    
    if (!dontStop) {
        appStarted = appStarted.then(() => app.stop_());
    }

    appStarted.catch(error => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = startWorker;