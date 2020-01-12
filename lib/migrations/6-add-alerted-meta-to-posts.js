const logger = require('../logger');

module.exports = async function addAlertedMetaToPosts (client) {
    try {
        await client.indices.putMapping({
            index: 'posts_alias',
            body: {
                properties: {
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
        });
    } catch (e) {
        logger.error(`Failed to create alerted_meta field in posts.`);
        console.log(e);
    }
}