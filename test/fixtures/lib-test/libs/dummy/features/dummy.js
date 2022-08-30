module.exports = {
    type: 'Services',
    load_: async (app, config, name) => {
        app.registerService(name, config);
    }
}