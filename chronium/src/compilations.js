const axios = require("axios")
const fs = require("fs-extra")
const { getAudioDurationInSeconds } = require('get-audio-duration');


const trends = require("./trends")
const scraper = require("./scraper");
const vEdit = require("./vEdit")
const iEdit = require("./iEdit")

const targetDuration = 8 * 60

module.exports = {
    createCompilation: (path) => {
        return new Promise(async resolve => {
            const result = await createCompilation(path)
            resolve(result)
        })
    }
}

async function createCompilation(path) {
    return new Promise(async resolve => {
        await scraper.init(false)

        fs.emptyDirSync("./temp/clips_ready")
        fs.emptyDirSync("./temp/clips_raw")

        const date = new Date()
        const day = date.getDay()
        const weeklyTrends = await trends.songs()

        const todaysTrend = weeklyTrends[day]

        const compilation = {
            metadata: todaysTrend,
            description: "Go follow the Creators: \n\n",
            clips: [],
            path: path
        }

        const songDuration = await getSongDuration(todaysTrend.playUrl)
        const numVideos = Math.round(targetDuration / (songDuration / 2))
        const links = await scraper.getVideos(todaysTrend.link, numVideos) // debug

        for (const link of links) {
            const videoMetadata = await scraper.analyzeVideo(link)
            compilation.clips.push(videoMetadata)

            //adding creators to description
            compilation.description += `${link}\n`
            
            const tempPath = await downloadVideo(videoMetadata.source, `./temp/clips_raw/${videoMetadata.code}.mp4`)
            videoMetadata.rawPath = tempPath
        }

        await scraper.close()

        console.log("Rendering");

        const rawClips = fs.readdirSync("./temp/clips_raw")

        for (const clip of rawClips) {
            console.log(clip);
            await vEdit.resize(`./temp/clips_raw/${clip}`, `./temp/clips_ready/${clip}`, 720, 1280)
        }

        const mergeSucessful = await vEdit.merge("./temp/clips_ready", "./temp/render", path)
        
        if (mergeSucessful == true) {
            console.log("rendering sucessful, removing temp files");
            fs.emptyDirSync("./temp/clips_ready")
            fs.emptyDirSync("./temp/clips_raw")
        }

        console.log("Creating thumbnail");
        const thumbnailPath = await iEdit.compilationThumbnail(compilation.metadata.coverMedium, compilation.metadata.title)
        compilation.thumbnail = thumbnailPath

        resolve(compilation)
    })
}

function downloadVideo(url, path) {
    return new Promise(async (resolve, reject) => {
        const buffer = await scraper.downloadVideo(url)

        if(buffer != false) {
            fs.writeFile(path, buffer, err => {
                if (err) {
                    console.log(err);
                    resolve(false)
                }
                else {
                    console.log("file saved under " +  path);
                    resolve(path)
                }
            })
        }
        else {
            resolve(false)
        }
    })
}

function getSongDuration(url) {
    return new Promise(async resolve => {
        const res = await axios({
            method: "get",
            url: url,
            responseType: "stream"
        })
        

        getAudioDurationInSeconds(res.data).then((duration) => {
            resolve(Math.round(duration))
        });
    })
}