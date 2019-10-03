const _                     = require('underscore');
const es                    = require('../../lib/elasticsearch');
const logger                = require('../../lib/logger');
const convertPostToIndex    = require('./convert-post-to-index');

const lastUpdatedExpireTime = 60 * 20 * 1000;
var archiveMetaStore = {};

setInterval(() => {
    archiveMetaStore = _.pick(archiveMetaStore, (value, key) => {
        return (new Date().getTime() - value.last_updated_at.getTime()) < lastUpdatedExpireTime;
    });
}, 60 * 1000);

module.exports = async function recordReplies (board, threadId, replies) {
    var body = [];

    _.each(replies, function (reply) {
        const key = `${board}/${threadId}`;
        let indexablePost = convertPostToIndex(board, reply);

        if (!archiveMetaStore[key]) {
            archiveMetaStore[key] = { "first_seen_at": new Date() };
        }

        archiveMetaStore[key].last_updated_at = new Date();

        indexablePost.archive_meta = archiveMetaStore[key];

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