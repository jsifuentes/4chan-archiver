const logger                    = require('../lib/logger');
const Instances                 = require('./instances');
const refreshInstances          = require('./refresh-instances');
const sleep                     = require('../lib/sleep');

module.exports = async function waitForRunningInstances (min) {
    min = min || 1;
    logger.debug(`Waiting until at least ${min} instance(s) are running...`);

    let conditionsMet = false;

    while (!conditionsMet) {
        await refreshInstances();
        conditionsMet = Instances.getRunningInstances().length > min;

        logger.silly(`Waiting another 2 seconds before checking for running instances...`);
        await sleep(2000);
    }

    return true;
}