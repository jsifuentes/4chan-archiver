const _                 = require('underscore');
const ConfigManager     = require('../../lib/config-manager');
const logger            = require('../../lib/logger');
const getActiveThreads  = require('./get-active-threads');

const config = ConfigManager.get();
const maxSubscriptionsPerBoard = config.max_subscriptions_per_board || -1;

// { "board": { "thread_id": { last_modified_at: "", last_fetched_at: new Date() } } }
var Subscriptions = undefined;

function flattenActiveThreadsResponse (pages) {
    return _.flatten(_.pluck(pages, 'threads'));
}

async function refreshSubscriptionList (boards) {
    Subscriptions = Subscriptions || {};

    for (let i = 0; i < boards.length; i++) {
        await (async (board) => {
            logger.debug(`Refreshing subscription list for ${board}`);
    
            const boardSubscriptionList = Subscriptions[board] || {};
            const activeThreads = await getActiveThreads(board);
            const flattened = flattenActiveThreadsResponse(activeThreads);
            // ['6872254', {last_modified_at: '2019-09-04'}]
            // { 6872254: {last_modified_at: '2019-09-04'} }
            let pairs = _.map(flattened, (thread) => {
                return [thread.no, boardSubscriptionList[thread.no] || {}];
            });

            if (maxSubscriptionsPerBoard > -1) {
                pairs = pairs.slice(0, maxSubscriptionsPerBoard);
            }

            const threadRows = _.object(pairs);
            const threadIds = _.keys(threadRows);
    
            const oldSubscriptionThreadIds = _.keys(boardSubscriptionList);
            const newThreadIds = _.difference(threadIds, oldSubscriptionThreadIds);
            const expiredThreadIds = _.difference(oldSubscriptionThreadIds, threadIds);
    
            logger.debug(`Added ${newThreadIds.length} new threads to monitor. Removed ${expiredThreadIds.length} threads from monitoring.`, {
                removed: expiredThreadIds,
                added: newThreadIds
            });
    
            Subscriptions[board] = threadRows;
        })(boards[i]);
    }

    return Subscriptions;
}

module.exports = {
    getSubscriptions: () => Subscriptions,
    setSubscriptions: (subscriptions) => Subscriptions = subscriptions,
    refreshSubscriptionList: refreshSubscriptionList,
    count: () => _.reduce(Object.keys(Subscriptions), (memo, board) => Object.keys(Subscriptions[board]).length)
};