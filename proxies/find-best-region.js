const _                 = require('underscore');
const ConfigManager     = require('../lib/config-manager');
const logger            = require('../lib/logger');
const Instances         = require('./instances');

const config                = ConfigManager.get();
const awsPossibleRegions    = config.aws.possible_regions;
const awsMaxPerRegion       = config.aws.max_servers_per_region || 10;

module.exports = function findBestRegionCandidate () {
    logger.debug(`Finding best region candidate.`);
    let regionStats = _.map(awsPossibleRegions, (region) => {
        const regionInstances = _.where(Instances.getInstances(), { Region: region }) || [];
        return { region: region, instances: regionInstances.length };
    });

    console.log(regionStats);

    // Get all stats for regions that have not exceeded the max amount of instances per region
    regionStats = _.filter(regionStats, (stat) => _.where(Instances.getInstances(), { Region: stat.region }).length < awsMaxPerRegion);
    logger.silly(`Best region is currently ${regionStats[0].region}`, { regions: regionStats });

    regionStats = _.sortBy(regionStats, 'instances');
    logger.silly(`Best region is currently ${regionStats[0].region}`, { regions: regionStats });

    return regionStats.length ? regionStats[0].region : null;
}