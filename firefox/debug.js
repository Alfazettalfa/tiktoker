const scraper = require("./src/scraper")

async function startScraper() {
    await scraper.init(false)
}

startScraper() 