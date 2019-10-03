const fs            = require('fs');
const _             = require('underscore');

var config = null;

function deepObjectExtend (target, source) {
    for (var prop in source) {
        if (source.hasOwnProperty(prop)) {
            if (target[prop] && _.isObject(source[prop]) && !_.isArray(source[prop])) {
                deepObjectExtend(target[prop], source[prop]);
            } else {
                target[prop] = source[prop];
            }
        }
    }
    return target;
}
function getConfig () {
    if (config === null) {
        const defaultConfig = JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf-8' }) || '{}');
        const envConfig = JSON.parse(fs.readFileSync('./config.env.json', { encoding: 'utf-8' }) || '{}');

        config = deepObjectExtend(defaultConfig, envConfig);
    }

    return config;
}

module.exports = {
    get: getConfig
}