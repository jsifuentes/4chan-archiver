const _                     = require('underscore');
const getRequestInstance    = require('../../lib/get-request-instance');
const logger                = require('../../lib/logger');

module.exports = async function getRepliesFromThread (board, threadId, lastModified) {
    logger.silly(`Fetching all replies from ${board}/${threadId}`);

    const config = {
        url: `http://a.4cdn.org/${board}/thread/${threadId}.json`,
        resolveWithFullResponse: true
    };

    if (lastModified) {
        config.headers = {
            'If-Modified-Since': lastModified
        };
    }

    const response = await getRequestInstance().get(config);

    return {
        replies: response.body.posts || [],
        lastModified: response.headers['last-modified'] || null
    };
}