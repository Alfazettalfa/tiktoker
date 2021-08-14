const scraper = require("./src/scraper")
const registry = require("./src/registry")

async function analyze() {
  await scraper.init(false)

  const stats = await scraper.analyzeVideo("https://www.tiktok.com/@charlidamelio/video/6808282941966306565")
  await scraper.close()

  console.log(stats);
} 

async function register() {
  await scraper.init(false)

  const stats = await scraper.analyzeVideo("https://www.tiktok.com/@charlidamelio/video/6808282941966306565")
  await scraper.close()

  console.log(stats);
  registry.register(stats)
}

function analyzeRegistry() {
  const data = registry.orderBy("music")
  console.log(data);
}

analyzeRegistry()