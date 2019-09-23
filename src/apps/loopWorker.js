const { sleep_ } = require('rk-utils');
const normalWorker = require('./worker');

function startWorker(workingPath, configName, worker, interval, workerName) {
    if (typeof interval === 'undefined') {
        interval = 1000;
    }

    return normalWorker(workingPath, configName, async (app) => {             
        while (true) {
            await worker(app);
            await sleep_(interval);
        }            
    }, workerName);
}

module.exports = startWorker;