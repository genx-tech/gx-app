const { Starters: { startWorker } } = require('../src');

startWorker(
    async (app) => {
        console.log(app.settings.test);
    },
    {
        loadConfigFromOptions: true,
        config: {
            settings: {
                "test": "hello"
            }
        }
    }
).then(() => {
    console.log('done.');
    process.exit(0);
}).catch(e => {
    console.error(e.error);
});