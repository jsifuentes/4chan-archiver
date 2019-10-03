const axios             = require('axios');
const logger            = require('./logger');
const ConfigManager     = require('./config-manager');
const getRandomInstance = require('../proxies/get-random');
const Instances         = require('../proxies/instances');

const config = ConfigManager.get();
const proxyUsername = config.proxy.username;
const proxyPassword = config.proxy.password;

function onRequestFinished (instanceId) {
    Instances.decrementActiveRequests(instanceId);
}

module.exports = function getAxiosInstance () {
    const instance = getRandomInstance();

    if (!instance) {
        throw new Error(`Could not find proxy host.`);
    }

    const instanceId = instance.InstanceId;
    const proxyHost = instance.PublicIpAddress;

    if (!instance) {
        throw new Error(`Instance ${instanceId} has no public ip address`);
    }

    logger.silly(`Using proxy ${proxyHost}`);

    Instances.incrementActiveRequests(instanceId);

    return axios.create({
        timeout: 2000,
        proxy: {
            host: proxyHost,
            port: 8080,
            auth: {
                username: proxyUsername,
                password: proxyPassword
            }
        },
        validateStatus: (status) => {
            onRequestFinished(instanceId);
            return status < 500;
        }
    });
}