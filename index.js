const scraper = require("./src/scraper")

async function init() {
    await scraper.init()

    //await downloadTikTok()
    //await scraper.analyzeVideo("https://www.tiktok.com/@kris8an/video/6984824458942942469")
    //await scraper.getVideoSource("https://www.tiktok.com/@jdk.official/video/6985860521241087238")
}

function downloadTikTok() {
    return new Promise(async (resolve, reject) => {
        const url = await scraper.getTikTok()
        console.log(url);
    })
}

init()