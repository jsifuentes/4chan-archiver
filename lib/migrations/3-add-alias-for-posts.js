const logger = require('../logger');

module.exports = async function addAliasForPosts (client) {
    try {
        await client.indices.putAlias({
            index: 'posts',
            name: 'posts_alias'
        });
    } catch (e) {
        logger.error(`Failed to create alias for posts_alias -> posts`);
        console.log(e);
    }
}