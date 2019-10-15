const _                     = require('underscore');
const logger                = require('../lib/logger');
const Instances             = require('./instances');
const getEC2Instances       = require('./get-ec2-instances');
const createNewProxies      = require('./create-new-proxies');
const terminateEC2Instances = require('./terminate-ec2-instances');
const ConfigManager         = require('../lib/config-manager');
const Subscriptions         = require('../scrapers/four/subscriptions');

const config                        = ConfigManager.get();
const maxProxyAge                   = config.proxy.max_age || 1800;
const minProxyServers               = config.proxy.min_servers || 3;
const maxProxyServers               = config.proxy.max_servers || 3;
const preferredMaxThreadsPerProxy   = config.proxy.preferred_max_threads_per_proxy || 50;
const refreshInstancesInterval      = 30; // secs

function getOutdatedProxies () {
    const instances = Instances.getInstances();
    const hasExpired = (instance) => ((new Date().getTime() - instance.LaunchTime.getTime())) / 1000 > maxProxyAge;
    return _.filter(instances, hasExpired);
}

var tick = 0;

const shouldExpediteRefresh = () => Instances.getInstances().length > Instances.getReadyInstances().length;
const canRefresh = () => shouldExpediteRefresh() || tick % (refreshInstancesInterval / 2) === 0;

async function refreshInstances () {
    if (!canRefresh()) {
        tick++;
        return;
    }

    tick++;

    logger.debug(`Refreshing EC2 Instances...`);

    // Get the current list of instances
    Instances.setInstances(await getEC2Instances(), tick > 1);

    // Terminate the outdated proxies
    const outdatedProxies = getOutdatedProxies();
    if (outdatedProxies.length > 0 && Instances.getPendingInstances().length === 0) {
        const terminating = outdatedProxies[0];

        if (!Instances.isScheduledForRemoval(terminating.InstanceId)) {
            logger.info(`Scheduling ${terminating.InstanceId} for deletion.`);

            Instances.scheduleForRemoval(terminating.InstanceId)
                .then(async () => {
                    try {
                        await terminateEC2Instances(terminating.InstanceId);
                        logger.info(`Terminated ${terminating.InstanceId} of ${outdatedProxies.length} outdated proxies`);
                    } catch (e) {
                        logger.error(`Could not terminate ${terminating.InstanceId}`);
                        console.log(e);
                    }
                });
        } else {
            logger.silly(`${terminating.instanceId} is already scheduled for removal.`);
        }
    }

    // Create proxies if they need to be created
    const neededServers = Math.max(0, minProxyServers - Instances.getInstances().length);
    if (neededServers > 0) {
        try {
            const createdInstances = await createNewProxies(neededServers);
            logger.info(`Created ${neededServers} new proxies. ${_.pluck(createdInstances, 'InstanceId').join(', ')}`);
            Instances.setInstances(await getEC2Instances());
        } catch (e) {
            logger.error(`Failed creating ${neededServers} new proxy instances`);
            console.log(e);
        }
    }

    logger.info(`Current proxies: ${_.map(Instances.getInstances(), Instances.getInstanceStatus).join(', ')}`);
    return Instances.getInstances();
}

module.exports = refreshInstances;