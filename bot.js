const bootstrapScraper  = require('./scrapers/bootstrap');
const bootstrapProxies  = require('./proxies/bootstrap');

async function bootstrap () {
    if (!process.env.NO_PROXIES) {
        await bootstrapProxies();
    }

    bootstrapScraper();
}

bootstrap();