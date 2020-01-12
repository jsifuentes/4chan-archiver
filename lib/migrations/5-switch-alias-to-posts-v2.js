const logger = require('../logger');

module.exports = async function switchAliasToPostsV2 (client) {
    try {
        await client.indices.updateAliases({
            body: {
                actions: [
                    { "remove": {
                        "alias": "posts_alias",
                        "index": "posts"
                    }},
                    { "add": {
                        "alias": "posts_alias",
                        "index": "posts_v2"
                    }}
                ]
            }
        });
    } catch (e) {
        logger.error(`Failed to create alias for posts_alias -> posts_v2`);
        console.log(e);
    }
}