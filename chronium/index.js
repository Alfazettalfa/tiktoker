const scraper = require("./src/scraper")
const fs = require('fs');
const uploader = require("./src/uploader");


const headless = false

function sleep(ms) {
    return new Promise(async resolve => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}

async function init() {
    var mode = "trends"

    console.log(`[${process.pid}]`);

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
        await scraper.init(headless)
        const prevUploads = JSON.parse(fs.readFileSync("./data/uploaded.json"))

        const video = await downloadTikTok(mode)
         
        console.log(video.metadata);

        await scraper.close()

        if (video != false) {
            if (video.metadata.likes > 10000) {
                if (!prevUploads.includes(video.metadata.link)) {
                    const links = await uploader.upload(video.metadata)
                    
                    console.log("Video Uploaded, waiting one Hour");

                    if (links[0] != false) {
                        prevUploads.push(video.metadata.link)
                    }
                    else {
                        console.log("Upload Limit reached, waiting 4 Hours");
                    }
                }
                else {
                    console.log("> video already online");
                }
            }
            else {
                console.log("small audience video, skipping...");
            }
        }
        else {
            console.log("> no video found");
        }

        fs.writeFileSync("./data/uploaded.json", JSON.stringify(prevUploads))

        resolve(true)
    })
}

function downloadTikTok(mode) {
    return new Promise(async (resolve, reject) => {
        const video = await scraper.getTikTok(mode)

        if(video != false) {
            const path = "./dispatch/video.mp4"

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
        }
        else {
            resolve(false)
        }
    })
}

async function debug() {
    await scraper.init()

    scraper.debug()

}

init()