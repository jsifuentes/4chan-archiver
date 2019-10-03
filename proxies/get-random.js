const _                 = require('underscore');
const Instances         = require('./instances');
const getRandomInt      = require('../lib/get-random-int');

const canUse = (instance) => {
    return !Instances.isScheduledForRemoval(instance.InstanceId) && !Instances.isTooNewToUse(instance.InstanceId);
}

module.exports = function getRandom () {
    let instances = Instances.getRunningInstances();
    instances = _.filter(instances, canUse);
    return instances[getRandomInt(0, instances.length - 1)];
}