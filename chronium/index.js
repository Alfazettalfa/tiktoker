const fs = require('fs');

const scraper = require("./src/scraper")
const uploader = require("./src/uploader");
const compilation = require("./src/compilations");


const headless = false
const dayTrackerFile = "./data/day.txt"
const compilationPath = "./temp/compilation/render.mp4"


function sleep(ms) {
    return new Promise(async resolve => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}

async function init() {
    var mode = "trends"
    await uploadCompilation()

    while (true) {
        await uploadShort(mode)

        if (mode == "startpage") {
            mode = "trends"
        }
        else {
            mode = "startpage"
        }
    }
}

function uploadCompilation() {
    return new Promise(async resolve => {
        const date = new Date()
        const currentDay = date.getDay()
        const lastUploadDay = Number(fs.readFileSync(dayTrackerFile))

        if (lastUploadDay != currentDay) {
            console.log("Creating daily compilation...");
            fs.writeFileSync(dayTrackerFile, String(currentDay))

            const meta = await compilation.createCompilation(compilationPath)

            const video = {
                path: compilationPath,
                title: `${meta.metadata.title} - ${meta.metadata.authorName} Viral TikToks Compilation`,
                description: meta.description,
                thumbnail: meta.thumbnail
            }

            console.log(video);

            await uploader.upload(video)
        }

        resolve()
    })
}

async function uploadShort(mode) {
    return new Promise(async resolve => {
        await scraper.init(headless)
        const prevUploads = JSON.parse(fs.readFileSync("./data/uploaded.json"))

        const video = await downloadTikTok(mode)
         
        console.log(video.metadata);

        await scraper.close()

        if (video != false) {
            if (video.metadata.likes > 100000) {
                if (!prevUploads.includes(video.metadata.link)) {
                    const links = await uploader.upload(video.metadata)
                    
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