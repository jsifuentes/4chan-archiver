const _         = require('underscore');
const AWS       = require('aws-sdk');
const logger    = require('../lib/logger');
const Instances = require('./instances');

function getPossibleRegion (instanceId) {
    const instances = Instances.getInstances();
    const instance = _.find(instances, { InstanceId: instanceId }) || {};

    return instance.Region || undefined;
}

function terminateEc2Instance (instanceId) {
    // instanceId = "i-asdasd"
    // instanceId = { "region": "us-east-1", "instance_id": "i-asdasd" }
    const instance = _.isObject(instanceId) ? instanceId : { instance_id: instanceId, region: getPossibleRegion(instanceId) };

    if (!instance.region) {
        throw new Error(`No region found for ${instance.instance_id}`);
    }

    logger.debug(`Terminating EC2 Instance ${instance.instance_id} from ${instance.region}`);
    
    AWS.config.update({ region: instance.region });
    const ec2 = new AWS.EC2({apiVersion: '2016-11-15'});
    return ec2.terminateInstances({
        InstanceIds: [instance.instance_id]
    }).promise();
}

function removeFromInstances (result) {
    Instances.removeInstance(result.TerminatingInstances[0].InstanceId);
    return result;
}

module.exports = function terminateEC2Instances(instanceIds) {
    instanceIds = _.isArray(instanceIds) ? instanceIds : [instanceIds];

    return Promise.all(_.map(instanceIds, (instanceId) => {
        return terminateEc2Instance(instanceId)
            .then(removeFromInstances);
    }));
}