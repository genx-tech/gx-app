function startWorker(workingPath, configName, worker, workerName) {
    const App = require('..');

    // create a Client instance with custom configuration
    let app = new App(workerName || 'Worker', {
        workingPath,
        configName
    });

    app.start_().then(worker).then(() => app.stop_()).catch(error => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = startWorker;