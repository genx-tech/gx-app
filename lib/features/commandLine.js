"use strict";

require("source-map-support/register");

const path = require('path');

const Feature = require('../enum/Feature');

const {
  _,
  pushIntoBucket,
  eachAsync_
} = require('@genx/july');

const {
  ApplicationError,
  InvalidConfiguration
} = require('@genx/error');

function translateMinimistOptions(opts) {
  let m = {};

  _.forOwn(opts, (detail, name) => {
    if (detail.bool) {
      pushIntoBucket(m, 'boolean', name);
    } else {
      pushIntoBucket(m, 'string', name);
    }

    if ('default' in detail) {
      _.set(m, `default.${name}`, detail.default);
    }

    if (detail.alias) {
      _.set(m, `alias.${name}`, detail.alias);
    }
  });

  return m;
}

function optionDecorator(name) {
  return name.length == 1 ? '-' + name : '--' + name;
}

const gArgv = process.argv.slice(2);

class CommandLineArgumentError extends ApplicationError {
  constructor(message, name, nonOption) {
    super(message, 'E_CLI_INVALID_ARG', {
      name,
      nonOption
    });
  }

}

class CommandLine {
  constructor(app, usage) {
    this.app = app;
    this.usage = usage;
    this.parse(usage.options);
  }

  injectUsage(injects) {
    this.injects = injects;
  }

  parse(options) {
    const minimist = this.app.tryRequire('minimist');
    this.argv = minimist(gArgv, translateMinimistOptions(options));
  }

  option(name) {
    return this.argv[name];
  }

  arg(name) {
    if (this.args[name]) return this.args[name];

    let index = _.findIndex(this.usage.arguments, arg => arg.name === name);

    if (index === -1 || this.argv._.length <= index) {
      return undefined;
    }

    this.args || (this.args = {});
    return this.args[name] = this.argv._[index];
  }

  updateOption(name, value) {
    this.argv[name] = value;
    let opts = this.usage.options[name];

    if (opts.alias) {
      _.each(opts.alias, a => {
        this.argv[a] = value;
      });
    }
  }

  async valueOrFunctionCall_(functor) {
    if (typeof functor === 'function') {
      return await functor(this);
    }

    return functor;
  }

  async inquire_() {
    const inquirer = this.app.tryRequire('inquirer');

    const doInquire_ = (item, argIndex) => inquirer.prompt([item]).then(answers => {
      console.log();

      _.forOwn(answers, (ans, name) => {
        if (typeof argIndex === 'undefined') {
          this.updateOption(name, ans);
        } else {
          assert: this.argv._.length === argIndex;

          this.argv._ = this.argv._.concat([ans]);
        }
      });
    });

    const doFilter_ = async (name, opt, argIndex) => {
      if (opt.filter) {
        if (typeof argIndex === 'undefined') {
          if (!(typeof opt.filter !== 'function')) {
            throw new InvalidConfiguration(`The "filter" in the inquirer option for argument option "${name}" should be a function!`, this.app, `commandLine.options[${name}].filter`);
          }

          this.updateOption(name, await opt.filter(this.argv[name], this));
        } else {
          if (!(typeof opt.filter !== 'function')) {
            throw new InvalidConfiguration(`The "filter" in the inquirer option for argument value "${name}" at position ${argIndex} should be a function!`, this.app, `commandLine.arguments[${argIndex}].filter`);
          }

          this.argv._[argIndex] = await opt.filter(this.argv._[argIndex], this);
        }
      }
    };

    const argExist = (name, argIndex) => typeof argIndex === 'undefined' ? name in this.argv : this.argv._.length > argIndex;

    const prepareInquire_ = async (opts, name, argIndex) => {
      let argExists = argExist(name, argIndex);

      if ('inquire' in opts && !argExists) {
        let inquire = this.valueOrFunctionCall_(opts.inquire);

        if (inquire) {
          let type;
          let q = {
            name: name,
            message: opts.promptMessage || opts.desc
          };

          if (opts.promptType) {
            type = opts.promptType;

            if (type === 'list' || type === 'rawList' || type === 'checkbox' || type === 'expand') {
              if (!opts.choicesProvider) {
                throw new InvalidConfiguration(typeof argIndex === 'undefined' ? `Missing "choicesProvider" in the inquirer option for argument option "${name}"!` : `Missing "choicesProvider" in the inquirer option for argument value "${name}" at postion ${argIndex}!`, app, typeof argIndex === 'undefined' ? `commandLine.options[${name}].choicesProvider` : `commandLine.arguments[${argIndex}].choicesProvider`);
              }

              q.choices = await this.valueOrFunctionCall_(opts.choicesProvider);
            }
          } else if (opts.bool) {
            type = 'confirm';
          } else {
            type = 'input';
          }

          q.type = type;

          if ('promptDefault' in opts) {
            q.default = await this.valueOrFunctionCall_(opts.promptDefault);
          }

          await doInquire_(q, argIndex);
          await doFilter_(name, opts, argIndex);

          if (opts.afterInquire) {
            await opts.afterInquire(this);
          }
        }
      } else if (argExists) {
        await doFilter_(name, opts, argIndex);

        if (opts.onArgumentExists) {
          await opts.onArgumentExists(this);
        }
      }

      if (this.usage.showArguments && argExist(name, argIndex)) {
        if (typeof argIndex === 'undefined') {
          console.log('option', name, `(${opts.desc})`, ':', this.argv[name]);
        } else {
          console.log(`<${name}>`, ':', this.argv._[argIndex]);
        }
      }
    };

    if (!_.isEmpty(this.usage.arguments)) {
      await eachAsync_(this.usage.arguments, async (argOpt, index) => {
        let {
          name,
          ...opts
        } = argOpt;
        return prepareInquire_(opts, name, index);
      });
    }

    return _.isEmpty(this.usage.options) || eachAsync_(this.usage.options, (opts, name) => prepareInquire_(opts, name));
  }

  async validate_() {
    const checkRequire_ = opts => this.valueOrFunctionCall_(opts.required);

    let errors = [];

    if (!_.isEmpty(this.usage.arguments)) {
      let argNum = this.argv._.length;

      if (argNum < this.usage.arguments.length) {
        let args = [];
        let i = 0;
        await eachAsync_(this.usage.arguments, async arg => {
          let required = await checkRequire_(arg);

          if (required) {
            if (i >= argNum) {
              let msg = `Missing required argument "${arg.name}"!`;

              if (this.usage.showUsageOnError) {
                errors.push(msg);
              } else {
                throw new CommandLineArgumentError(msg, arg.name, true);
              }
            } else {
              args.push(this.argv._[i++]);
            }
          }
        });
        this.argv._ = args;
      }
    }

    this.usage.options && (await eachAsync_(this.usage.options, async (opts, name) => {
      let required = await checkRequire_(opts);

      if (required && !(name in this.argv)) {
        let msg = `Missing required argument option of "${name}"!`;

        if (this.usage.showUsageOnError) {
          errors.push(msg);
        } else {
          throw new CommandLineArgumentError(msg, name);
        }
      }
    }));

    if (errors.length > 0) {
      this.showUsage({
        afterBanner: () => 'Error(s):\n' + errors.map(msg => ' - ' + msg).join('\n') + '\n\n'
      });
      process.exit(1);
    }
  }

  async fillSilentModeDefaults_() {
    await eachAsync_(this.usage.arguments, async (arg, index) => {
      if (this.argv._.length <= index) {
        if (arg.hasOwnProperty('silentModeDefault')) {
          for (let i = this.argv._.length; i < index; i++) {
            this.argv._.push(undefined);
          }

          this.argv._.push(await this.valueOrFunctionCall_(arg.silentModeDefault));
        }
      }
    });
    await eachAsync_(this.usage.options, async (opts, name) => {
      if (!this.argv.hasOwnProperty(name) && opts.hasOwnProperty('silentModeDefault')) {
        this.updateOption(name, await this.valueOrFunctionCall_(opts.silentModeDefault));
      }
    });
  }

  getBanner() {
    if (this.usage.banner) {
      let banner = '';

      if (typeof this.usage.banner === 'function') {
        banner += this.usage.banner(this);
      } else if (typeof this.usage.banner === 'string') {
        banner += this.usage.banner;
      } else {
        throw new InvalidConfiguration('Invalid banner value of commandLine feature.', this.app, `commandLine.banner`);
      }

      banner += '\n';
      return banner;
    }

    return undefined;
  }

  getUsage(injects) {
    injects = { ...this.injects,
      ...injects
    };
    let usage = '';
    let banner = !this.bannerShown && this.getBanner();

    if (banner) {
      usage += banner + '\n';
    }

    if (injects && injects.afterBanner) {
      usage += injects.afterBanner();
    }

    let fmtArgs = '';

    if (!_.isEmpty(this.usage.arguments)) {
      fmtArgs = ' ' + this.usage.arguments.map(arg => arg.required ? `<${arg.name}>` : `[${arg.name}]`).join(' ');
    }

    usage += `Usage: ${this.usage.program || path.basename(process.argv[1])}${fmtArgs} [options]\n\n`;

    if (injects && injects.afterCommandLine) {
      usage += injects.afterCommandLine();
    }

    if (!_.isEmpty(this.usage.options)) {
      usage += `Options:\n`;

      _.forOwn(this.usage.options, (opts, name) => {
        let line = '  ' + optionDecorator(name);

        if (opts.alias) {
          line += _.reduce(opts.alias, (sum, a) => sum + ', ' + optionDecorator(a), '');
        }

        line += '\n';
        line += '    ' + opts.desc + '\n';

        if ('default' in opts) {
          line += '    default: ' + opts.default.toString() + '\n';
        }

        if (opts.required) {
          if (typeof opts.required === 'function') {
            line += '    conditional\n';
          } else {
            line += '    required\n';
          }
        }

        if (opts.choicesProvider && Array.isArray(opts.choicesProvider)) {
          line += '    available values:\n';
          opts.choicesProvider.forEach(choice => {
            line += `        "${choice.value}": ${choice.name}\n`;
          });
        }

        line += '\n';
        usage += line;
      });
    }

    if (injects && injects.afterOptions) {
      usage += injects.afterOptions();
    }

    return usage;
  }

  showBannar() {
    let banner = this.getBanner();

    if (banner) {
      console.log(banner);
      this.bannerShown = true;
    }
  }

  showUsage(injects) {
    console.log(this.getUsage(injects));
  }

}

module.exports = {
  type: Feature.INIT,
  load_: async (app, usageOptions) => {
    app.commandLine = new CommandLine(app, usageOptions);
    let silentMode = usageOptions.silentMode;

    if (silentMode && typeof silentMode === 'function') {
      silentMode = silentMode(app.commandLine);
    }

    app.commandLine.silentMode = silentMode;

    if (silentMode) {
      await app.commandLine.fillSilentModeDefaults_();
    } else {
      app.commandLine.showBannar();
      await app.commandLine.inquire_();
    }

    let nonValidationMode = usageOptions.nonValidationMode;

    if (nonValidationMode && typeof nonValidationMode === 'function') {
      nonValidationMode = nonValidationMode(app.commandLine);
    }

    app.commandLine.nonValidationMode = nonValidationMode;

    if (!nonValidationMode) {
      await app.commandLine.validate_();
    }
  }
};