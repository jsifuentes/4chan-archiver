const getAxiosInstance  = require('../../lib/get-axios-instance');
const logger            = require('../../lib/logger');

module.exports = async function getArchiveThreads (board) {
    const response = await getAxiosInstance().get(`http://a.4cdn.org/${board}/archive.json`);
    logger.debug(`Finished fetching archive threads from ${board}`);
    return response.data;
}