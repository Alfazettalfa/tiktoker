const scraper = require("./src/scraper")
const fs = require('fs');
const uploader = require("../chronium/uploader");

function min(m) {
    let mins = 0

    return new Promise(resolve => {
        console.log(`waiting for ${m} minutes`);

        const timerInterval = setInterval(() => {
            mins += 1
            console.log(`waiting for ${m - mins} more minutes`);

            if (mins >= m) {
                clearInterval(timerInterval)
                resolve()
            }
        }, 60000);
    })
}

async function init() {
    var mode = "startpage"

    while (true) {
        await upload(mode)

        if (mode == "startpage") {
            mode = "trends"
        }
        else {
            mode = "startpage"
        }
    }
}

async function upload(mode) {
    return new Promise(async resolve => {
        await scraper.init()
        const prevUploads = JSON.parse(fs.readFileSync("./uploaded.json"))

        const video = await downloadTikTok(mode)
         
        console.log(video.metadata);
        

        await scraper.close()

        if (!prevUploads.includes(video.metadata.link)) {
            const links = await uploader.upload(video.metadata)
            if (links[0] != false) {
                prevUploads.push(video.metadata.link)
            }
            else {
                console.log("Upload Limit reached, waiting 4 Hours");
                await min(240)
            }
        }
        else {
            console.log("> video already online");
        }

        fs.writeFileSync("./uploaded.json", JSON.stringify(prevUploads))

        resolve(true)
    })
}

function downloadTikTok(mode) {
    return new Promise(async (resolve, reject) => {
        const video = await scraper.getTikTok(mode)

        const path = "../dispatch/video.mp4"

        fs.writeFile(path, video.buffer, err => {
            if (err) {
                console.log(err);
                resolve(err)
            }
            else {
                video.metadata.path = path

                console.log("file saved under " +  path);
                resolve(video)
            }
        })
    })
}

async function debug() {
    await scraper.init()

    scraper.debug()

}

init()