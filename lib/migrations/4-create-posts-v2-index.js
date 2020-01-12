const logger = require('../logger');

module.exports = async function createPostsV2Index (client) {
    try {
        await client.indices.create({
            index: 'posts_v2',
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
                        }
                    }
                }
            }
        });
    } catch (e) {
        logger.error(`Failed to create posts v2 index`);
        console.log(e);
    }
}