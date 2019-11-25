function startCommand(commandName, commandHandler, config, loggerOpt) {
    const App = require('..');    
    const { combine, colorize, simple } = App.loggerProvider.format;

    if (typeof loggerOpt === 'string') {
        loggerOpt = {
            level: loggerOpt
        };
    }

    loggerOpt = {
        colorize: true,
        level: 'info',
        ...loggerOpt
    };

    let cliApp = new App(commandName, { 
        logger: {        
            "transports": [
                {
                    "type": "console",
                    "options": {                            
                        "level": loggerOpt.level,
                        "format": loggerOpt.colorize ? combine(colorize(), simple()) : simple()
                    }
                }
            ]
        },
        loadConfigFromOptions: true,
        config
    });

    cliApp.start_().then(commandHandler).then(() => cliApp.stop_()).catch(error => {
        if (cliApp.started) {
            
        }
         console.error(error);
        process.exit(1);
    });
}

module.exports = startCommand;