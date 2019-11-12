const _     = require('underscore');
const es    = require('../../lib/elasticsearch');

module.exports = async function getUnindexedThreadIds (threadIds) {
    let results = await es.client.search({
        index: 'posts_alias',
        body: {
            "query": {
                "terms": {
                   "_id": threadIds
                }
            }
        }
    });

    let indexedThreadIds = [];

    return _.difference(threadIds, indexedThreadIds);
}