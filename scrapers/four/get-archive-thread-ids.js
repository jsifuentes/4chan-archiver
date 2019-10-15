const getRequestInstance    = require('../../lib/get-request-instance');
const logger                = require('../../lib/logger');

module.exports = async function getArchiveThreads (board) {
    const response = await getRequestInstance().get(`http://a.4cdn.org/${board}/archive.json`);
    logger.debug(`Finished fetching archive threads from ${board}`);
    return response;
}