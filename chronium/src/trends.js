const axios = require("axios")

module.exports = {
    songs: () => {
        return new Promise(async resolve => {
            const songs = await getSongs()
            resolve(songs)
        })
    }
}

function getSongs() {
    return new Promise(async resolve => {
        const res = await axios.get("https://tokboard.com/api/week")
        const songs = res.data

        songs.forEach(set => {
            const link = `https://www.tiktok.com/music/${set.title.replace(/ /g, '-')}-${set.id}`
            set.link = link
        })

        resolve(songs)
    })
}