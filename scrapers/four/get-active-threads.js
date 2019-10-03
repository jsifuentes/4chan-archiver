const getAxiosInstance  = require('../../lib/get-axios-instance');
const logger            = require('../../lib/logger');

module.exports = async function getActiveThreads (board) {
    try {
        const response = await getAxiosInstance().get(`http://a.4cdn.org/${board}/threads.json`);
        return response.data;
    } catch (e) {
        logger.error(`Got an error while retrieving active threads from ${board}`);
        logger.error(e);
    }

    logger.debug(`Finished fetching active threads from ${board}`);
}