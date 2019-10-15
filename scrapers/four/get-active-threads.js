const getRequestInstance    = require('../../lib/get-request-instance');
const logger                = require('../../lib/logger');

module.exports = function getActiveThreads (board) {
    try {
        return getRequestInstance().get(`http://a.4cdn.org/${board}/threads.json`);
    } catch (e) {
        logger.error(`Got an error while retrieving active threads from ${board}`);
        console.log(e);
    }

    logger.debug(`Finished fetching active threads from ${board}`);
}