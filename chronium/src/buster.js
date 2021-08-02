var Jimp = require('jimp');

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
        return new Promise(async (resolve, reject) => {
            const percentage = await solve(url)
            resolve(percentage)
        })
    }
}

async function debug() {
    const percentage = await solve("https://p16-security-va.ibyteimg.com/img/security-captcha-oversea-usa/slide_3e45cf8f3963f31ae7e607c27b4b719814a2163e_1_1.jpg~tplv-obj.image")
    console.log(percentage);
}

function analyze(data) {
    const width = data.bitmap.width;
    const height = data.bitmap.height;
    const hitsX = []

    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            const hex = data.getPixelColor(x, y)
            const rgb = Jimp.intToRGBA(hex)

            const factor = rgb.r + rgb.g + rgb.b
            
            if (factor > 700) {
                hitsX.push(x)

                const marker = Jimp.rgbaToInt(255 - x, 0, x / 2, 255)
                data.setPixelColor(marker, x, y)
            }
        }
    }

    const frontBorderX = getFrontBorder(hitsX)
    const backBorderX = hitsX[hitsX.length - 1]
    const percent = Math.round(frontBorderX * 100 / width)

    for (y = 0; y < height; y++) {
        const marker = Jimp.rgbaToInt(255, 0, 0, 255)
        data.setPixelColor(marker, frontBorderX, y)
    }
    for (y = 0; y < height; y++) {
        const marker = Jimp.rgbaToInt(255, 0, 0, 255)
        data.setPixelColor(marker, backBorderX, y)
    }


    return {data: data, percent: percent};
}


//get the front border of the puzzle shape
function getFrontBorder(hits) {
    hits.forEach(hit => {
        const occurrences = arrayDublicates(hit, hits)
        
        if (occurrences > 10) {
            return hit
        }
    })

    return hits[0]
}

function arrayDublicates(target, array) {
    let occurrences = 0

    array.forEach(value => {
        if (value == target) {
            occurrences += 1
        }
    })

    return occurrences
}