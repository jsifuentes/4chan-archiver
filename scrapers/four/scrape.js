const _                         = require('underscore');
const logger                    = require('../../lib/logger');
const Subscriptions             = require('./subscriptions');
const getArchiveThreadIds       = require('./get-archive-thread-ids');
const getRepliesFromThread      = require('./get-replies-from-thread');
const recordReplies             = require('./record-replies');
const getUnindexedThreadIds     = require('./get-unindexed-thread-ids');
const ConfigManager             = require('../../lib/config-manager');

const config = ConfigManager.get();
const tickInterval = 500;
const maxThreadsPerTick = config.max_threads_per_tick || 15;
const secsBetweenThreadUpdate = config.secs_between_thread_update || 10;

var subscriptionBoards = [];
var numberOfTicks = 0;

function getMaxEfficientThreadsPerTick () {
    // If ticks are every second, and we want threads to be updated every 10 seconds, then I have 10 opportunites to cover all threads
    const ticksBetweenWantedThreadUpdates = secsBetweenThreadUpdate / (tickInterval / 1000);
    const subscriptionsList = Subscriptions.getSubscriptions();
    const flattenedThreads = flattenThreads(subscriptionsList);
    const numberOfSubscribed = flattenedThreads.length;

    return Math.ceil(numberOfSubscribed / ticksBetweenWantedThreadUpdates);
}

function getMaxThreadsPerTick () {
    const maxEfficient = getMaxEfficientThreadsPerTick();

    return maxThreadsPerTick > -1 ? Math.min(maxEfficient, maxThreadsPerTick) : maxEfficient;
}

async function getArchiveThreads (boards) {
    _.each(boards, async (board) => {
        let threadIds;
        try {
            threadIds = await getArchiveThreadIds(board);
        } catch (e) {
            return;
        }

        threadIds = threadIds.splice(0, 5);
        let unindexedThreadIds = await getUnindexedThreadIds(threadIds);

        _.each(unindexedThreadIds, async (threadId) => {
            try {
                let response = await getRepliesFromThread(board, threadId);
                let replies = response.replies;

                await recordReplies(board, threadId, replies);
                logger.silly(`Saved ${board}/${threadId} from the archive.`);
            } catch (e) {
                logger.error(`Could not save thread ${threadId} from archive.`);
                console.log(e);
            }
        });
    })
}

function flattenThreads (subscriptions) {
    return _.reduce(Object.keys(subscriptions), (currentVal, board) => {
        return currentVal.concat(_.map(subscriptions[board], (meta, threadId) => {
            return { board: board, thread_id: threadId, ...meta };
        }));
    }, []);
}

function compareByLastFetched (a, b) {
    let comparison = 0;
    let aLastFetched = a.last_fetched_at || new Date(1970, 1, 1);
    let bLastFetched = b.last_fetched_at || new Date(1970, 1, 1);

    if (aLastFetched.getTime() > bLastFetched.getTime()) {
        comparison = 1;
    } else if (aLastFetched.getTime() < bLastFetched.getTime()) {
        comparison = -1;
    }

    return comparison;
}

function getNextThreadsToUpdate () {
    const shouldUpdate = (lastFetchedAt) => (new Date().getTime() - (lastFetchedAt || 0)) > secsBetweenThreadUpdate * 1000;
    const flattenedThreads = flattenThreads(Subscriptions.getSubscriptions());
    flattenedThreads.sort(compareByLastFetched);

    return _.filter(flattenedThreads, meta => shouldUpdate(meta.last_fetched_at))
        .slice(0, getMaxThreadsPerTick());
}

async function updateThread (currentTick, board, threadId, meta) {
    const lastModifiedAt = meta.last_modified_at;
    const lastFetchedAt = meta.last_fetched_at || new Date();
    const differenceSinceLastFetched = Math.floor((new Date().getTime() - lastFetchedAt.getTime()) / 1000);
    const subscriptionList = Subscriptions.getSubscriptions();

    logger.debug(`#${currentTick} Updating ${board}/${threadId} (${differenceSinceLastFetched} sec. since last fetched)`);

    subscriptionList[board][threadId] = subscriptionList[board][threadId] || {};

    try {
        subscriptionList[board][threadId].last_fetched_at = new Date();
        const { replies, lastModified } = await getRepliesFromThread(board, threadId, lastModifiedAt);
        subscriptionList[board][threadId].last_modified_at = lastModified;

        if (replies.length > 0) {
            await recordReplies(board, threadId, replies);

            logger.silly(`Saved replies for ${board}/${threadId}`, {
                repliesCount: replies.length
            });
        }
    } catch (e) {
        if (e.statusCode === 404) {
            // Remove from subscriptions list.
            delete subscriptionList[board][threadId];
            logger.debug(`Removed ${threadId} from subscription list because it threw a 404.`);
        } else if (e.statusCode === 304) {
            logger.silly(`No changes to ${board}/${threadId} since last modified at ${lastModifiedAt}`);
        } else {
            // So it force fetches next tick
            subscriptionList[board][threadId].last_fetched_at = new Date(1970, 1, 1);
            logger.error(`Failed to fetch replies for ${board}/${threadId}`);
            console.log(e);
        }
    }
}

async function processTick (currentTick) {
    /**
     * Update the subscription list every 30 seconds.
     * This will allow us to update the subscription list before
     * we go out and fetch the replies.
     */
    if (Subscriptions.getSubscriptions() === undefined || numberOfTicks % 30 === 0) {
        await Subscriptions.refreshSubscriptionList(subscriptionBoards);
        logger.info(`#${currentTick} Finished refetching subscriptions list. Current thread count: ${Subscriptions.count()}`);
        logger.info(`#${currentTick} Max threads per tick: ${getMaxThreadsPerTick()}. Max possible: ${getMaxEfficientThreadsPerTick()}`);
    }

    const promises = [];
    const threads = getNextThreadsToUpdate();

    if (threads.length === 0) {
        logger.silly(`#${currentTick} No threads to update`);
        return [];
    }

    const oldestThreadDifference = Math.floor((new Date().getTime() - (threads[0].last_fetched_at || new Date()).getTime()) / 1000);

    _.each(threads, (meta) => {
        promises.push(updateThread(currentTick, meta.board, meta.thread_id, meta));
    });

    return Promise.all(promises).then(() => {
        if (threads.length > 0) {
            logger.info(`#${currentTick} Finished with all ${threads.length} threads. Max time between fetches: ${oldestThreadDifference} secs. Tick difference: ${numberOfTicks - currentTick}`);
        }
    });
}

module.exports = function scrape (boards) {
    logger.info(`Started 4chan scraper - ${boards.join(', ')}`);
    subscriptionBoards = boards;

    // Fetch all archive threads
    // getArchiveThreads(boards);

    setInterval(() => {
        numberOfTicks++;

        processTick(numberOfTicks)
    }, tickInterval)
}