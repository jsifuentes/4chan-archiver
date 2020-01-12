const logger = require('../logger');

async function switchAliasToPostsV3 (client) {
    try {
        await client.indices.updateAliases({
            body: {
                actions: [
                    { "remove": {
                        "alias": "posts_alias",
                        "index": "posts_v2"
                    }},
                    { "add": {
                        "alias": "posts_alias",
                        "index": "posts_v3"
                    }}
                ]
            }
        });
    } catch (e) {
        logger.error(`Failed to create alias for posts_alias -> posts_v3`);
        console.log(e);
    }
}

async function createPostsV3Index (client) {
    try {
        await client.indices.create({
            index: 'posts_v3',
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
                        clean_body: { type: "text" },
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
                        },
                        alerted_meta: {
                            properties: {
                                matches: { type: "boolean" },
                                keywords: { type: "text" },
                                groups: { type: "text" },
                                comment: { type: "text" }
                            }
                        }
                    }
                }
            }
        });
    } catch (e) {
        logger.error(`Failed to create posts v3 index`);
        console.log(e);
    }
}

module.exports = async function createPostsV3IndexAndSwitchAlias (client) {
    await createPostsV3Index(client);
    await switchAliasToPostsV3(client);
}