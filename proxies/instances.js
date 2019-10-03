const _             = require('underscore');
const ConfigManager = require('../lib/config-manager');
const logger        = require('../lib/logger');
const sleep         = require('../lib/sleep');

const config = ConfigManager.get();

const newInstanceCoolDownTime = config.proxy.new_instance_cooldown_time || 5000;

var Instances = {};
var InstancesMeta = {};
var ScheduledForRemoval = [];
var TooNewToUse = [];

// setInterval(() => { console.log(InstancesMeta) }, 1000);

function setInstances(instances, markAsNew) {
    const oldInstances = Instances;
    markAsNew = markAsNew === undefined ? true : markAsNew;
    Instances = instances;

    const isInstanceRunning = (instance) => instance.State.Name === "running";
    const oldRunningInstances = _.filter(oldInstances, isInstanceRunning);
    const currentRunningInstances = _.filter(Instances, isInstanceRunning);
    const newInstances = _.filter(currentRunningInstances, (instance) => !_.findWhere(oldRunningInstances, { InstanceId: instance.InstanceId }));

    if (newInstances.length > 0) {
        logger.info(`Proxy Servers: New Servers - ${_.map(newInstances, getInstanceStatus).join(', ')}`);

        _.each(newInstances, (instance) => {
            if (markAsNew) {
                TooNewToUse[instance.InstanceId] = true;
            }

            createInstanceMeta(instance.InstanceId);
        });

        if (markAsNew) {
            setTimeout(() => {
                _.each(newInstances, (instance) => {
                    logger.info(`${instance.InstanceId} is now available to proxy`, TooNewToUse);
                    delete TooNewToUse[instance.InstanceId];
                })
            }, newInstanceCoolDownTime);
        }
    }

    const deletedInstances = _.filter(oldRunningInstances, (instance) => !_.findWhere(currentRunningInstances, { InstanceId: instance.InstanceId }));

    if (deletedInstances.length > 0) {
        logger.info(`Proxy Servers: Deleted Servers - ${_.map(deletedInstances, getInstanceStatus).join(', ')}`);

        _.each(newInstances, (instance) => {
            delete InstancesMeta[instance.InstanceId];
        });
    }

    return Instances;
}

function scheduleForRemoval (instanceId, region) {
    ScheduledForRemoval.push({ InstanceId: instanceId, Region: region });

    return new Promise(async (resolve, reject) => {
        console.log(instanceId, getInstanceMeta(instanceId));
        while ((meta = getInstanceMeta(instanceId)) && meta.active_requests > 0) {
            logger.info(`${instanceId} still has ${meta.active_requests} active requsts. Cannot terminate yet.`);
            await sleep(1000);
        }

        resolve();
    });
}

const addInstance = (instance) => setInstances(Instances.concat(instance));
const removeInstance = (instanceId) => setInstances(_.filter(Instances, (instance) => instance.InstanceId !== instanceId));
const getInstanceStatus = (instance) => `${instance.PublicIpAddress} (${instance.Region}) (${instance.State.Name})`;
const isScheduledForRemoval = (instanceId) => _.findWhere(ScheduledForRemoval, { InstanceId: instanceId }) !== undefined;
const isTooNewToUse = (instanceId) => !!TooNewToUse[instanceId];
const getRunningInstances = () => _.filter(Instances, (instance) => instance.State.Name === "running");
const getPendingInstances = () => _.filter(Instances, (instance) => instance.State.Name === "pending");
const createInstanceMeta = () => ({ active_requests: 0 })
const getInstanceMeta = (instanceId) => InstancesMeta[instanceId] || createInstanceMeta();
const setInstanceMetaKey = (instanceId, key, value) => {
    let instanceMeta = getInstanceMeta(instanceId);
    instanceMeta[key] = value;
    InstancesMeta[instanceId] = instanceMeta;
    return InstancesMeta[instanceId];
}

const incrementActiveRequests = (instanceId) => {
    let instanceMeta = getInstanceMeta(instanceId);
    return setInstanceMetaKey(instanceId, 'active_requests', (instanceMeta['active_requests'] || 0) + 1);
}

const decrementActiveRequests = (instanceId) => {
    let instanceMeta = getInstanceMeta(instanceId);
    return setInstanceMetaKey(instanceId, 'active_requests', (instanceMeta['active_requests'] || 1) - 1);
};

module.exports = {
    getInstances: () => Instances,
    setInstances: setInstances,
    addInstance: addInstance,
    removeInstance: removeInstance,
    scheduleForRemoval: scheduleForRemoval,
    isScheduledForRemoval: isScheduledForRemoval,
    isTooNewToUse: isTooNewToUse,
    getRunningInstances: getRunningInstances,
    getPendingInstances: getPendingInstances,
    getInstanceStatus: getInstanceStatus,
    getInstanceMeta: getInstanceMeta,
    setInstanceMetaKey: setInstanceMetaKey,
    incrementActiveRequests: incrementActiveRequests,
    decrementActiveRequests: decrementActiveRequests
};