const bootstrapScraper  = require('./scrapers/bootstrap');
const bootstrapProxies  = require('./proxies/bootstrap');

async function bootstrap () {
    await bootstrapProxies();
    bootstrapScraper();
}

bootstrap();