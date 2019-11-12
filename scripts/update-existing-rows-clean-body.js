const _             = require('underscore');
const es            = require('../lib/elasticsearch');
const dehtmlify     = require('../lib/dehtmlify');

function waitForTaskToFinish (taskId) {
    return es.client.tasks.get({
        task_id: taskId,
        wait_for_completion: true
    });
}

function getNextPosts () {
    return es.client.search({
        index: 'posts',
        body: {
            size: 10000,
            query: {
                bool: {
                    must_not: {
                        exists: {
                            field: "clean_body"
                        }
                    }
                }
            }
        }
    });
}

function bulkUpdatePosts (posts) {
    let body = [];

    _.each(posts, (post) => {
        body.push({ update: { _id: post._id, _index: "posts" } });
        body.push({ doc : { clean_body: dehtmlify(post._source.body) } });
    });

    return es.client.bulk({ body: body });
}


async function bootstrap () {
    try {
        await es.client.ping();
    } catch (e) {
        logger.error('Cannot connect to Elasticsearch');
        console.log(e);
        return;
    }

    let hasPosts = true;
    // get list of posts that do not have a clean body
    let i = 0;
    while (hasPosts) {
        let result = await getNextPosts();

        if (result.hits.hits.length > 0) {
            // cool
            // bulk update now
            await bulkUpdatePosts(result.hits.hits);
            console.log(++i + ' round completed');
        } else {
            hasPosts = false;
        }
    }
}

bootstrap();