var Jimp = require('jimp');
const fs = require('fs');

const download = require("./downloader");

function solve(url) {
    return new Promise(async (resolve, reject) => {
        await download(url)

        const data = await Jimp.read(`./captchas/download.jpg`)
        const solution = analyze(data)

        solution.data.write(`./captchas/solution.jpg`)

        resolve(solution.percent)
    })
}

module.exports = {
    solve: url => {
        return new Promise(async resolve => {
            const percentage = await solve(url)
            resolve(percentage)
        })
    },
    test: () => {
        test()
    },
    debug: () => {
        debug()
    }
}

async function debug() {
    const sample = "5.jpg"

    const data = await Jimp.read(`./samples/${sample}`)
    const result = analyze(data);

    result.data.write(`./analyzed/${sample}`)
}

async function test() {
    const samples = fs.readdirSync("./samples")

    samples.forEach(async sample => {
        const data = await Jimp.read(`./samples/${sample}`)
        const result = analyze(data);

        result.data.write(`./analyzed/${sample}`)

        console.log(`${sample}: ${result.percent}%`);
    })
}

function analyze(data) {
    const width = data.bitmap.width;
    const height = data.bitmap.height;
    const hits = []

    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            const hex = data.getPixelColor(x, y)
            const rgb = Jimp.intToRGBA(hex)

            const factor = rgb.r + rgb.g + rgb.b
            
            if (factor > 700) {
                hits.push({x: x, y: y})

                const marker = Jimp.rgbaToInt(255 - x / 2, 0, x / 2, 255)
                data.setPixelColor(marker, x, y)
            }
        }
    }

    const frontBorder = getBorder(hits)
    const backBorder = getBorder(hits.reverse())
    const percent = Math.round(frontBorder.x * 100 / width)

    for (y = 0; y < height; y++) {
        const marker = Jimp.rgbaToInt(255, 0, 0, 255)

        data.setPixelColor(marker, frontBorder.x, y)
        data.setPixelColor(marker, backBorder.x, y)
    }

    return {data: data, percent: percent};
}


function getBorder(hits) {
    const lineTreshold = 10

    for (hit of hits) {
        const lineLength = dedectX(hits, hit)
        
        if (lineLength > lineTreshold) {
            return hit
        }
    }

    return false
}

function dedectX(hits, target) {
    let line = 0

    hits.forEach(hit => {
        if (hit.x == target.x) {
            line += 1
        }
    })

    return line
}
