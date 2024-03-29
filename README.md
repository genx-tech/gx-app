# @genx/app

Gen-X micro-service application framework [https://github.com/genx-tech/gx-app](https://github.com/genx-tech/gx-app)

![GitHub last commit](https://img.shields.io/github/last-commit/genx-tech/gx-app)

## example

### usage

    const CliApp = require('@genx/app');

    let cliApp = new CliApp('test');

    cliApp.start_().then(() => {
        cliApp.log('info', 'started.');

        cliApp.showUsage();

        let biLogs = cliApp.getService('logger:bi');
        biLogs.info({
            user: 'tester',
            operation: 'ad hoc smoke test'
        });

        let tracer = cliApp.getService('logger:trace');
        tracer.info(cliApp.settings.parser.lib);

        return cliApp.stop_();
    }).catch(error => {
        console.error(error);
        process.exit(1);
    });

### sample app config

    {
        "version": "1.0",
        "cmdLineOptions": {
            "banner": "#!jsv: (app) => `This is the program banner v${app.version}`",
            "arguments": [
                { "name": "target file", "required": true }
            ],  
            "options": {
                "e": {
                    "desc": "Target environment",
                    "alias": [ "env", "environment" ],
                    "default": "development"
                },            
                "v": {
                    "desc": "Show version number",
                    "alias": [ "version" ],
                    "isBool": true,
                    "default": false
                },
                "?": {
                    "desc": "Show usage message",
                    "alias": [ "help" ],
                    "isBool": true,
                    "default": false
                }
            }
        },  
        "bootstrap": {},
        "devConfigByGitUser": {},
        "settings": {
            "parser": {
                "lib": "default"
            }
        },
        "loggers": {
            "trace": {
                "transports": [
                {
                    "type": "console",                   
                    "options": {      
                        "level": "info",                      
                        "format": "#!jsv: log.format.combine(log.format.colorize(), log.format.simple())"
                    }
                },
                {
                    "type": "daily-rotate-file",                   
                    "options": {
                        "level": "verbose",
                        "filename": "category2-%DATE%.log",
                        "datePattern": "YYYYMMDD"
                    }
                }
            ]
            },
            "bi": {
                "transports": [
                    {
                    "type": "mongodb",
                    "options": {
                        "db": "mongodb://root:root@localhost/biLogs?authSource=admin"
                    }
                }
                ]
            }
        }
    }

### featureRegistry

```
featureRegistry: {
  "*": "fallback path",
  "feature1": "feature1 file path", // feature1 = require("feature1 file path");
  "feature2": [ "feature2 file path", "object path" ] // feature2 = Util.getValueByPath(require("feature2 file path"), "object path")
}
```

## Changes

### v2.1.0

* upgrade luxon lib from 1.x to 3.x, refers to the link below for upgrading guideline

    [Luxon upgrading](https://moment.github.io/luxon/#/upgrading)

## Development guideline

### Bump version

* pnpm build
* pnpm changeset
* pnpm bump
* pnpm publish

## License

  MIT    