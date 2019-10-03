require('./bootstrap');
const _                     = require('underscore');
const getEC2Instances       = require('./get-ec2-instances');
const terminateEC2Instances = require('./terminate-ec2-instances');

async function bootstrap () {
    let instances = await getEC2Instances();
    let runningInstances = _.filter(instances, (instance) => instance.State.Name === "running");
    let params = _.map(runningInstances, (instance) => {
        return { instance_id: instance.InstanceId, region: instance.Region };
    });

    const result = await terminateEC2Instances(params);
    console.log(result);
}

bootstrap();