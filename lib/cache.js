const fs     = require('fs');
const logger = require('./logger');

const cacheFileName = 'cache.json';

// var cache = require(cacheFileName);
var cache = {};
try {
    cache = JSON.parse(fs.readFileSync(cacheFileName, { encoding: 'utf8' })) || {};
} catch (e) {
    cache = {};
}

function getCacheKey (key) {
    return cache[key];
}

function setCacheKey (key, value) {
    cache[key] = value;
    writeBackToFile(cache);
}

function hasCacheKey (key) {
    return !!cache[key];
}

function writeBackToFile (c) {
    fs.writeFile(cacheFileName, JSON.stringify(c, null, 2), (err) => {
        if (err) {
            logger.error(`Failed to create cache file.`);
            console.log(err);
        }
    });
}

module.exports = {

    KEY_MIGRATION_VERSION: 'migration_version',

    get: getCacheKey,
    set: setCacheKey,
    has: hasCacheKey


};