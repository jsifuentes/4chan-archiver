const _                     = require('underscore');
const AWS                   = require('aws-sdk');
const ConfigManager         = require('../lib/config-manager');
const logger                = require('../lib/logger');
const Instances             = require('./instances');
const findBestRegion        = require('./find-best-region');
const getRequestInstance    = require('../lib/get-request-instance');

const config                = ConfigManager.get();
const awsAmiIds             = config.aws.ami_ids;
const awsInstanceType       = config.aws.instance_type;
const awsKeyPairName        = config.aws.keypair_name;
const awsSecurityGroups     = config.aws.security_groups;

async function createNewServer (region) {
    AWS.config.update({ region: region });

    const instanceParams = {
        ImageId: awsAmiIds[region], 
        InstanceType: awsInstanceType,
        KeyName: awsKeyPairName,
        SecurityGroups: awsSecurityGroups || [],
        MinCount: 1,
        MaxCount: 1,
        TagSpecifications: [
            {
                ResourceType: 'instance',
                Tags: [
                    {
                        Key: 'Service',
                        Value: 'archiver-proxy-server'
                    },
                    {
                        Key: 'Environment',
                        Value: process.env.NODE_ENV || 'production'
                    },
                    {
                        Key: 'Name',
                        Value: (process.env.NODE_ENV || 'production') + '-archiver-proxy'
                    }
                ]
            }
        ]
    };

    logger.debug(`Creating instance in ${region}`, instanceParams);
    return new AWS.EC2({apiVersion: '2016-11-15'}).runInstances(instanceParams).promise();
}

function checkForReadyProxies () {
    let instances = Instances.getNotReadyInstances();

    if (instances.length < 1) {
        return;
    }

    _.each(instances, async (instance) => {
        try {
            const request = getRequestInstance(instance);
            await request.get('https://www.google.com/');
            Instances.isReadyToUse(instance.InstanceId, true);
            logger.info(`${instance.InstanceId} is ready to use as a proxy.`);
        } catch (e) {
            logger.debug(`${instance.InstanceId} is still not ready. ${e.message}`);
        }
    });
}

setInterval(checkForReadyProxies, 1000);

module.exports = async function createNewProxies (number) {
    number = number || 1;

    for (let i = 0; i < number; i++) {
        const bestRegion = findBestRegion()

        if (bestRegion === null) {
            throw new Error(`No region was available to create a proxy`);
        }

        const result = await createNewServer(bestRegion);
        let instance = result.Instances[0];
        instance.Region = bestRegion;
        Instances.addInstance(instance);
    }
}