const fs = require("fs-extra")
const rimraf = require("rimraf")

const registry = require("./src/registry")
const uploader = require("./src/uploader")
const trends = require("./src/trends")
const compilations = require("./src/compilations")
const vEdit = require("./src/vEdit")
const iEdit = require("./src/iEdit")
const scraper = require("./src/scraper")

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

async function scrapeCompilation() {
  await scraper.init(false)
  
  const links = await scraper.getVideos("https://www.tiktok.com/music/Savage-6800996740322297858?lang=de-DE&is_copy_url=1&is_from_webapp=v1", 50)
  const videos = []

  for (const link of links) {
    const video = await scraper.analyzeVideo(link)
    videos.push(video)
    console.log(video);
  }

  await scraper.close()
}

async function scraperIdle() {
  await scraper.init(false)

  //await scraper.close()
}


async function testUpload() {
  const exampleVideo = {
      path: './dispatch/video.mp4',
      title: 'Testupload', 
      description: 'test\n\ntest'
  }

  await uploader.upload(exampleVideo)
  console.log("done!");
}

function queryRegistry(query) {
  const set = registry.get(query)
  console.log(set);
}

async function testTrendsFinder() {
  const data = await trends.songs()
  console.log(data[0]);
}

async function createCompilation() {
  const result = await compilations.createCompilation("./temp/compilation/render.mp4")
  console.log(result);
}

async function clearDir() {
  fs.emptyDirSync("./temp/clips_ready")
}

async function thumbGen() {
  const thumbnailPath = iEdit.compilationThumbnail("https://p16-amd-va.tiktokcdn.com/img/tos-useast2a-v-2774/c87696b217954599af9e3b1b5deebf9d~c5_720x720.jpeg", "Origina ass 123 Get Into It (Yuh)")
}

async function testDownloader() {
  const url = "https://www.tiktok.com/@landwird3/video/7000424887932243205"

  await scraper.init(false)
  const meta = await scraper.analyzeVideo(url)
  const video = await scraper.downloadVideo(meta.source)

  await scraper.close()

  console.log(video);
}

testDownloader()