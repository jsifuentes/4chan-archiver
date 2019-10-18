const logger        = require('./logger');
const elasticsearch = require('elasticsearch');
const ConfigManager = require('./config-manager');
const Cache         = require('./cache');
const sleep         = require('./sleep');

async function createPostsIndex (client) {
    let result;

    try {
        result = await client.indices.exists({ index: 'posts' });
    } catch (e) {
        logger.error('Failed to see if posts index exists');
        console.log(e);
        return;
    }

    if (!result) {
        try {
            await client.indices.create({
                index: 'posts',
                body: {
                    mappings: {
                        properties: {
                            board: { type: "text" },
                            author: {
                                properties: {
                                    name: { type: "text" },
                                    group: { type: "text" },
                                    trip: { type: "text" },
                                    capcode: { type: "text" },
                                    country_iso: { type: "text" },
                                    country: { type: "text" }
                                }
                            },
                            subject: { type: "text" },
                            body: { type: "text" },
                            file: {
                                properties: {
                                    name: { type: "text" },
                                    width: { type: "integer" },
                                    height: { type: "integer" },
                                    thumbnail_width: { type: "integer" },
                                    thumbnail_height: { type: "integer" },
                                    size: { type: "integer" },
                                    md5: { type: "text" },
                                    is_deleted: { type: "boolean" }
                                }
                            },
                            posted_at: { type: "date" },
                            timestamp: { type: "long" },
                            timestamp_ms: { type: "long" },
                            reply_to: { type: "long" },
                            is_sticky: { type: "boolean" },
                            is_closed: { type: "boolean" },
                            is_spoiler: { type: "boolean" },
                            unique_ips: { type: "integer" },
                            archive_meta: {
                                properties: {
                                    first_seen_at: { type: "date" },
                                    last_updated_at: { type: "date" }
                                }
                            }
                        }
                    }
                }
            });

            logger.info('Created posts index');
        } catch (e) {
            logger.error('Error creating posts index');
            console.log(e);
        }
    }
}

async function createIndexes (client) {
    await createPostsIndex(client)
}

async function updateIndexes (client) {
    let migrationVersion = parseInt(Cache.get(Cache.KEY_MIGRATION_VERSION)) || 0;

    if (migrationVersion < 2) {
        await addCleanBodyFieldToPosts(client);
        Cache.set(Cache.KEY_MIGRATION_VERSION, 2);
    }
}

async function syncIndexes (client) {
    createIndexes(client);
    await sleep(2000);
    updateIndexes(client);
}

async function addCleanBodyFieldToPosts (client) {
    try {
        await client.indices.putMapping({
            index: 'posts',
            body: {
                "properties": {
                    "clean_body": {
                        "type": "text"
                    }
                }
            }
        });
    } catch (e) {
        logger.error(`Failed to create clean_body field in posts.`);
        console.log(e);
    }
}

const config = ConfigManager.get();

module.exports = {
    client: new elasticsearch.Client({
        host: config.elasticsearch_host,
        log: 'info'
    }),
    syncIndexes: syncIndexes
};