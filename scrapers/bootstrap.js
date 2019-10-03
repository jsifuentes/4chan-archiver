const logger            = require('../lib/logger');
const fourChanScraper   = require('./four/scrape');
const es                = require('../lib/elasticsearch');
const ConfigManager     = require('../lib/config-manager');

const config = ConfigManager.get();

module.exports = async function scraper () { 
    try {
        await es.client.ping();
        await es.createIndexes(es.client);
    } catch (e) {
        logger.error('Cannot connect to Elasticsearch');
        logger.error(e);
        return;
    }

    const boards = config.scrapers['4chan'].boards;

    if (!boards || boards.length === 0) {
        logger.error(`Cannot start 4chan archiver because config.scrapers.4chan.boards is empty.`);
        return;
    }

    fourChanScraper(boards);
}