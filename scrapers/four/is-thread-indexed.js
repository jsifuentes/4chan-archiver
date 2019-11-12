const es = require('../lib/elasticsearch');

module.exports = function isThreadIndexed (threadId) {
    return es.client.exists({
        id: threadId,
        index: 'posts_alias'
    });
}