const AWS                       = require('aws-sdk');
const _                         = require('underscore');
const logger                    = require('../lib/logger');
const ConfigManager             = require('../lib/config-manager');
const Instances                 = require('./instances');
const refreshInstances          = require('./refresh-instances');
const waitForRunningInstances   = require('./wait-for-running-instances');
const sleep                     = require('../lib/sleep');

const config                = ConfigManager.get();
const awsAccessKeyId        = config.aws.access_key_id;
const awsSecretAccessKey    = config.aws.access_key_secret;
const possibleRegions       = config.aws.possible_regions;

AWS.config.update({
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: possibleRegions[0]
});

// The idea is to have at least x running at any single time
module.exports = async function bootstrapProxies () {
    let currentInstances = await refreshInstances();

    if (Instances.getRunningInstances().length === 0) {
        logger.info(`Pausing bootstrapping until at least one running proxy found...`);
        await waitForRunningInstances(1);
        await sleep(5000);
    }

    currentInstances = Instances.getRunningInstances();
    setInterval(refreshInstances, 2000);

    return currentInstances;
}