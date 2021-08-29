const jimp = require("jimp")
const fs = require("fs")
const exportPath = "./temp/thumb.jpg"

module.exports = {
    compilationThumbnail: async (url, title) => {
        return new Promise(async resolve => {
            const font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
            const background = await jimp.read(randomFile("./temp/backgrounds"))
            const cover = await jimp.read(url)
                .catch(err => {
                    console.log(err);
                })
            
            background
                .brightness(-0.3)
                .resize(1152, 648)
            
            cover
                .resize(400, 400)

            const imgOffsetX = 100
            const imgOffsetY = (background.bitmap.height / 2) - (cover.bitmap.height / 2)
            
            const textOffsetX = imgOffsetX + cover.bitmap.width + imgOffsetX
            const textOffsetY = imgOffsetY + 80
        
            background
                .blur(Math.round(Math.random() * 20))
                .composite(cover, imgOffsetX, imgOffsetY)
                .print(font, textOffsetX, textOffsetY, title, background.bitmap.width * 0.4)
                .write(exportPath, () => {
                    resolve(exportPath)
                })
            })
    }
}

function randomFile(path) {
    const files = fs.readdirSync(path)
    const seed = Math.round(Math.random() * (files.length -1))

    return `${path}/${files[seed]}`
}