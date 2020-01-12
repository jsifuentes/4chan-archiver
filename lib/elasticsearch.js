const logger        = require('./logger');
const elasticsearch = require('elasticsearch');
const ConfigManager = require('./config-manager');
const Cache         = require('./cache');
const sleep         = require('./sleep');

const createPostsIndex = require('./migrations/1-create-posts-index');
const addCleanBodyFieldToPosts = require('./migrations/2-add-clean-body-field-to-posts');
const addAliasForPosts = require('./migrations/3-add-alias-for-posts');
const createPostsV2Index = require('./migrations/4-create-posts-v2-index');
const switchAliasToPostsV2 = require('./migrations/5-switch-alias-to-posts-v2');
const addAlertedMetaToPosts = require('./migrations/6-add-alerted-meta-to-posts');
const createPostsV3IndexAndSwitchAlias = require('./migrations/7-create-posts-v3-index-and-switch-alias');

async function createIndexes (client) {
    await createPostsIndex(client)
}

async function updateIndexes (client) {
    let migrationVersion = parseInt(Cache.get(Cache.KEY_MIGRATION_VERSION)) || 0;

    if (migrationVersion < 2) {
        await addCleanBodyFieldToPosts(client);
        Cache.set(Cache.KEY_MIGRATION_VERSION, 2);
    }

    if (migrationVersion < 3) {
        await addAliasForPosts(client);
        Cache.set(Cache.KEY_MIGRATION_VERSION, 3);
    }

    if (migrationVersion < 4) {
        await createPostsV2Index(client);
        Cache.set(Cache.KEY_MIGRATION_VERSION, 4);
    }

    if (migrationVersion < 5) {
        await switchAliasToPostsV2(client);
        Cache.set(Cache.KEY_MIGRATION_VERSION, 5);
    }

    if (migrationVersion < 6) {
        await addAlertedMetaToPosts(client);
        Cache.set(Cache.KEY_MIGRATION_VERSION, 6);
    }

    if (migrationVersion < 7) {
        await createPostsV3IndexAndSwitchAlias(client);
        Cache.set(Cache.KEY_MIGRATION_VERSION, 7);
    }
}

async function syncIndexes (client) {
    createIndexes(client);
    await sleep(2000);
    updateIndexes(client);
}

const config = ConfigManager.get();

module.exports = {
    client: new elasticsearch.Client({
        host: config.elasticsearch_host,
        log: 'info'
    }),
    syncIndexes: syncIndexes
};