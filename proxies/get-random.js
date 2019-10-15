const _                 = require('underscore');
const Instances         = require('./instances');
const getRandomInt      = require('../lib/get-random-int');

module.exports = function getRandom () {
    let instances = Instances.getReadyInstances();
    return instances[getRandomInt(0, instances.length - 1)];
}