const _                     = require('underscore');
const es                    = require('../../lib/elasticsearch');
const logger                = require('../../lib/logger');
const convertPostToIndex    = require('./convert-post-to-index');
const dehtmlify             = require('../../lib/dehtmlify');
const doesPostMatch         = require('../../triggers/does-post-match');

const lastUpdatedExpireTime = 120 * 60 * 1000;
var archiveMetaStore = {};

setInterval(() => {
    archiveMetaStore = _.pick(archiveMetaStore, (value, key) => {
        return (new Date().getTime() - value.last_updated_at.getTime()) < lastUpdatedExpireTime;
    });
}, 60 * 1000);

function transformPost (post) {
    let key = `${post.board}/${post._id}`;

    post.archive_meta = archiveMetaStore[key];
    post.clean_body = dehtmlify(post.body);

    if (!archiveMetaStore[key]) {
        archiveMetaStore[key] = { "first_seen_at": new Date() };

        let result = doesPostMatch(post);

        if (result.matched) {
            logger.verbose(`Alerted on ${post.board}/${post._id}`, result);
            post.alerted_meta = {
                matches: true,
                keywords: result.matched_against,
                groups: result.matched_groups,
                comment: 'Automatic detection'
            };
        }
    }

    archiveMetaStore[key].last_updated_at = new Date();
    return post;
}

module.exports = async function recordReplies (board, threadId, replies) {
    var body = [];

    _.each(replies, function (reply) {
        let indexablePost = convertPostToIndex(board, reply);
        indexablePost = transformPost(indexablePost);

        body.push({
            index: {
                _index: 'posts_alias',
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
        console.log(e);
    }
};