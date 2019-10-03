const _             = require('underscore');
const AWS           = require('aws-sdk');
const ConfigManager = require('../lib/config-manager');
const logger        = require('../lib/logger');

const config = ConfigManager.get();

async function getEC2InstancesByRegion(region) {
    AWS.config.update({ region: region });
    const ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

    var instances = [];

    try {
        let request = ec2.describeInstances({
            Filters: [
                {
                    Name: 'tag:Service',
                    Values: ['archiver-proxy-server']
                },
                {
                    Name: 'instance-state-name',
                    Values: ['running', 'pending']
                }
            ]
        });

        let response = await request.promise();

        if (response.Reservations.length > 0) {
            instances = _.flatten(_.pluck(response.Reservations, 'Instances'));
        }
    } catch (e) {
        logger.error(`Could not fetch instances from EC2 for ${region}`);
        logger.error(e);
    }

    return instances;
}

module.exports = async function getEC2Instances() {
    var allInstances = [];

    for (let i = 0; i < config.aws.possible_regions.length; i++) {
        let region = config.aws.possible_regions[i];
        let regionInstances = await getEC2InstancesByRegion(region);
        regionInstances = regionInstances.map(v => ({ ...v, Region: region }));
        allInstances = allInstances.concat(regionInstances);
    }

    return allInstances;
}