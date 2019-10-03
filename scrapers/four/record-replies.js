const _                     = require('underscore');
const es                    = require('../../lib/elasticsearch');
const logger                = require('../../lib/logger');
const convertPostToIndex    = require('./convert-post-to-index');

module.exports = async function recordReplies (board, threadId, replies) {
    var body = [];

    _.each(replies, function (reply) {
        let indexablePost = convertPostToIndex(board, reply);

        body.push({
            index: {
                _index: 'posts',
                _id: indexablePost._id
            }
        });

        body.push(_.omit(indexablePost, '_id'));
    });

    try {
        es.client.bulk({
            body: body
        });
    } catch (e) {
        logger.error(`Failed to bulk record replies for ${board}/${threadId}`);
        logger.error(e);
    }
};