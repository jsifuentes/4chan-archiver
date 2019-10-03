const _                     = require('underscore');
const es                    = require('../../lib/elasticsearch');
const logger                = require('../../lib/logger');
const convertPostToIndex    = require('./convert-post-to-index');

const createdAtExpireTime = 60 * 20;
var createdAtStore = {};

setInterval(() => {
    createdAtStore = _.pick(createdAtStore, (value, key) => {
        return (new Date().getTime() - value.getTime()) < createdAtExpireTime;
    });
}, (20 * 60));

module.exports = async function recordReplies (board, threadId, replies) {
    var body = [];

    _.each(replies, function (reply) {
        const key = `${board}/${threadId}`;
        let indexablePost = convertPostToIndex(board, reply);

        createdAtStore[key] = createdAtStore[key] || new Date();

        indexablePost.archive_meta = {
            first_seen_at: createdAtStore[key],
            last_updated_at: new Date()
        };

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