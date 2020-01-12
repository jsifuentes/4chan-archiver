const logger = require('../logger');

module.exports = async function addCleanBodyFieldToPosts (client) {
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