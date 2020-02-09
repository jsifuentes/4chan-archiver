const request           = require('request-promise');
const randomUserAgent   = require('random-useragent');
const logger            = require('./logger');
const ConfigManager     = require('./config-manager');
const getRandomInstance = require('../proxies/get-random');
const Instances         = require('../proxies/instances');

const config = ConfigManager.get();
const proxyUsername = config.proxy.username;
const proxyPassword = config.proxy.password;
const proxyPort     = config.proxy.port;

function wrapRequestMethod (func, instanceId) {
    return function (uri, opts, callback) {
        let instance = func(uri, opts, callback);
        instance.on('request', () => Instances.incrementActiveRequests(instanceId));
        instance.on('response', () => {
            Instances.decrementActiveRequests(instanceId)
            Instances.resetTimeouts(instanceId);
        });
        instance.on('error', (e) => {
            Instances.decrementActiveRequests(instanceId);

            if (!e.statusCode) {
                Instances.incrementTimeouts(instanceId);
            }
        });
        return instance;
    }
}

module.exports = function getRequestInstance (instance) {
    let config = {
        headers: {
            'User-Agent': randomUserAgent.getRandom()
        },
        timeout: 2000,
        json: true
    },
        requestInstance,
        instanceId,
        proxyHost;

    if (!process.env.NO_PROXIES) {
        instance = instance || getRandomInstance();

        if (!instance) {
            throw new Error(`Could not find proxy host.`);
        }

        instanceId = instance.InstanceId;
        proxyHost = instance.PublicIpAddress;

        logger.silly(`Using proxy ${proxyHost}`);

        config.proxy = `http://${encodeURI(proxyUsername)}:${encodeURI(proxyPassword)}@${proxyHost}:${proxyPort}`;
    }

    requestInstance = request.defaults(config);

    if (!process.env.NO_PROXIES) {
        let verbs = ['get', 'head', 'post', 'put', 'patch', 'del', 'delete']
        verbs.forEach((verb) => {
            requestInstance[verb] = wrapRequestMethod(requestInstance[verb], instanceId)
        })
    }

    return requestInstance;
}