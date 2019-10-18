const es = require('../lib/elasticsearch');

async function bootstrap () {
    try {
        await es.client.ping();
    } catch (e) {
        logger.error('Cannot connect to Elasticsearch');
        console.log(e);
        return;
    }
}

bootstrap();