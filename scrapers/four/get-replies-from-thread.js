const _                 = require('underscore');
const getAxiosInstance  = require('../../lib/get-axios-instance');
const logger            = require('../../lib/logger');

module.exports = async function getRepliesFromThread (board, threadId, lastModified) {
    logger.silly(`Fetching all replies from ${board}/${threadId}`);

    const config = lastModified ? {
        headers: {
            'If-Modified-Since': lastModified
        }
    } : undefined;

    const response = await getAxiosInstance().get(`http://a.4cdn.org/${board}/thread/${threadId}.json`, config);

    return {
        replies: response.data.posts || [],
        lastModified: response.headers['last-modified'] || null
    };
}