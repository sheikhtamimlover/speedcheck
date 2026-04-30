'use strict';

/**
 * speedcheck — Full-featured internet speed & network diagnostics
 * Author: Sheikh Tamim <https://github.com/sheikhtamimlover>
 * Repo:   https://github.com/sheikhtamimlover/speedcheck
 */

const SpeedCheck = require('./speedcheck');
const { getIPInfo } = require('./ipinfo');
const { measurePing } = require('./ping');
const { measureDownload } = require('./download');
const { measureUpload } = require('./upload');
const { getNetworkZone } = require('./zone');
const { formatResults } = require('./formatter');

module.exports = {
  SpeedCheck,
  getIPInfo,
  measurePing,
  measureDownload,
  measureUpload,
  getNetworkZone,
  formatResults,
};

// Allow direct CLI execution
if (require.main === module) {
  const chalk = require('chalk');
  const ora = require('ora');

  (async () => {
    console.log(chalk.cyan.bold('\n⚡  speedcheck — Network Diagnostics Tool'));
    console.log(chalk.gray('   by Sheikh Tamim · https://github.com/sheikhtamimlover/speedcheck\n'));

    const checker = new SpeedCheck();
    const spinner = ora({ text: 'Running full diagnostics...', color: 'cyan' }).start();

    try {
      const results = await checker.runAll();
      spinner.succeed(chalk.green('Diagnostics complete!\n'));
      console.log(formatResults(results));
    } catch (err) {
      spinner.fail(chalk.red('Diagnostics failed: ' + err.message));
      process.exit(1);
    }
  })();
}
