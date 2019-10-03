const logger            = require('../lib/logger');
const fourChanScraper   = require('./four/scrape');
const es                = require('../lib/elasticsearch');

module.exports = async function scraper () { 
    try {
        await es.client.ping();
        await es.createIndexes(es.client);
    } catch (e) {
        logger.error('Cannot connect to Elasticsearch');
        logger.error(e);
        return;
    }
    fourChanScraper(['k', 'r9k', 'b', 'pol']);
}