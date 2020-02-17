const { Starters: { startCommand } } = require('../src');

startCommand(() => {
    console.log('Hello CLI');
}, {        
    commandName: 'testcli',    
    loadConfigFromOptions: true,
    logger: {
        level: 'debug'
    },
    config: {
        "commandLine": {
            "banner": 'Test'
        }                
    }
});