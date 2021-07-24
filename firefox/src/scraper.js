const puppeteer = require('puppeteer')
const session = {}
var browser

module.exports = {
    init: async () => {
        return new Promise(async resolve => {
            browser = await puppeteer.launch({
                product: 'firefox',
                headless: false,
                defaultViewport: null,
                args: [
                    '--no-sandbox',
                    "--remote-debugging-port=0",
                    "--auto-open-devtools-for-tabs"
                ]
            })
            .catch(err => {
                console.log(err);
            })

            console.log("Scraper initiated");

            session.page = await browser.newPage()

            resolve()
        })
    },
    getTikTok: async mode => {
        return new Promise(async resolve => {
            console.log("starting scrape in mode: " + mode);
            let links
            

            if (mode == "trends") {
                const trends = await getTrends()
                const chosenTrend = trends[Math.round(Math.random() * trends.length - 1)]

                links = await getVideos(chosenTrend)
            }

            if (mode == "startpage") {
                links = await getStartpage()
            }

            console.log(links);
            
            const videos = []

            for (const link of links) {
                const video = await analyzeVideo(link)
                console.log(video);
                videos.push(video)
            }

            const mostLikedVideo = mostLiked(videos)
            const source = await getVideoSource(mostLikedVideo.link)
            const video = await downloadVideo(source)

            console.log("got the vid");
            resolve({
                metadata: mostLikedVideo,
                buffer: video
            })
        })
    },
    close: async () => {
        return new Promise(async resolve => {
            browser.close()

            console.log("Scraper Closed");
            resolve(true)
        })
    },
    getVideoSource: url => {
        return new Promise(async resolve => {
            const source = await getVideoSource(url)

            resolve(source)
        })
    },
    analyzeVideo: src => {
        return new Promise (async resolve => {
            const stats = await analyzeVideo(src)
            console.log(stats);
        })
    },
    debug: async () => {
        const meta = await analyzeVideo("https://www.tiktok.com/@imgriffinjohnson/video/6827892555624025350")
        console.log(meta);
    }
}

function getStartpage() {
    return new Promise(async resolve => {
        session.page.goto("https://www.tiktok.com/")
        await session.page.waitForNavigation({ timeout: 5000})
            .catch(err => {
                console.log("->");
            })

        await session.page.waitForSelector(".item-video-container")
        await sleep(2000)
        
        //waiting for pae to load, then scroll and wait again for videos to render
        await session.page.evaluate(() => {
            window.scrollTo({ top: 6000, behavior: 'smooth' })
        })

        await sleep(2000)

        //then start collecting links
        const videos = await session.page.evaluate(() => {
            const trendingVideos = document.getElementsByClassName("feed-item-content")
            const videoLinks = []

            console.log(trendingVideos);
            
            for (const trendingVideo of trendingVideos) {
                if (videoLinks.length < 10) {
                    console.log(trendingVideo);
                    try {
                        const link = trendingVideo.children[4].children[0].children[0].href
                        videoLinks.push(link)
                    }
                    catch {
                        console.log("video has no link");
                    }
                }
                else {
                    break
                }
            }

            return videoLinks
        })

        resolve(videos)
    })
}

function downloadVideo(source) {
    return new Promise(async resolve => {
        await session.page.goto(source)

        const response = await session.page.evaluate(async (source) => {
            return new Promise(async resolve => {
                const res = await fetch(source)
                const blob = await res.blob()
                
                const reader = new FileReader();

                reader.readAsBinaryString(blob);
                reader.onload = () => {
                    resolve(reader.result)
                }
                reader.onerror = () => reject('Error occurred while reading binary string');
            })
        }, source)

        
        const buffer = Buffer.from(response , 'binary');
        
        resolve(buffer)
    })


}

function getVideoSource(url) {
    return new Promise(async resolve => {
        console.log("getting video source of " + url);

        session.page.goto(url)
        await session.page.waitForNavigation({ timeout: 5000})
            .catch(err => {
                console.log("->");
            })

        await sleep(1000)

        const source = await session.page.evaluate(() => {
            const video = document.getElementsByTagName("video")[0]
            console.log(video);
            return video.src
        })

        resolve(source)
    })
}

function mostLiked(videos) {
    let top = false
    let max = 0

    videos.forEach(video => {
        if (video.likes > max) {
            max = video.likes
            top = video
        }
    })

    return top
}

function analyzeVideo(link) {
    return new Promise(async resolve => {
        session.page.goto(link)
        await session.page.waitForNavigation({ timeout: 3000})
            .catch(err => {
                console.log("->");
            })
        
        await session.page.waitForSelector('.pc-action-bar')

        const metadata = await session.page.evaluate(() => {
            const panel = document.getElementsByClassName("pc-action-bar")[0]

            const likes = panel.children[0].children[1].innerHTML
            const comments = panel.children[1].children[1].innerHTML
            const videoTitle = document.title.split(document.title.indexOf("#"))[0]
            const videoMusic = document.getElementsByClassName("music-title-decoration")[0].innerText

            console.log(likes, comments);

            return [likes, comments, videoTitle, videoMusic]
        })



        const stats = {
            link: link,
            title: parseTitle(metadata[2], metadata[3]),
            tags: parseTags(metadata[2]),
            likes: parseNumber(metadata[0]),
            comments: parseNumber(metadata[1]),
            description: "#shorts - find more on "
        }

        resolve(stats)
    })
}

function parseTitle(title, music) {
    const words = title.split(" ")
    const clean = []

    words.forEach((word, index) => {
        if (!word.includes("#")) {
           clean.push(word)
        }
    })

    const stringed = clean.join(" ")

    return `${stringed} | ${music}`
}

//parseTitle("@nickisartdrawings look at this @dixiedamelio #ja #dawda #w", "ROCKSTAR - DaBaby, Roddy Ricch")

function parseTags(str) {
    const words = str.split(" ")
    const tags = []

    words.forEach(word => {
        if (word.charAt(0) == "#") {
            tags.push(word)
        }
    })

    return tags
}

function sleep(ms) {
    return new Promise(async resolve => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}

function parseNumber(str) {
    if (str.includes("K")) {
        const base = str.match(/\d+/)[0]
        return base * 1000
    }
    if (str.includes("M")) {
        const base = str.match(/\d+/)[0]
        return base * 1000000
    }
    if (str.includes("B")) {
        const base = str.match(/\d+/)[0]
        return base * 1000000000
    }

    return parseInt(str)
}

function getVideos(link) {
    return new Promise(async resolve => {
        console.log("getting video links");

        session.page.goto(link)
        await session.page.waitForNavigation({ timeout: 3000})
            .catch(err => {
                console.log("->");
            })

        await session.page.waitForSelector(".video-feed-item")

        const videos = await session.page.evaluate(() => {
            const trendingVideos = document.getElementsByClassName("video-feed-item")
            const videoLinks = []

            console.log(trendingVideos);
            
            for (const trendingVideo of trendingVideos) {
                if (videoLinks.length < 10) {
                    console.log(trendingVideo);
                    const link = trendingVideo.childNodes[0].childNodes[0].childNodes[0].childNodes[0].href
                    videoLinks.push(link)
                }
                else {
                    break
                }
            }

            return videoLinks
        })

        resolve(videos)
    })
}

function getTrends() {
    return new Promise(async resolve => {
        console.log("getting trends");

        session.page.goto("https://www.tiktok.com/")
        await session.page.waitForNavigation({ timeout: 10000})
            .catch(err => {
                console.log("->");
            })

        await session.page.waitForSelector(".discover-list")

        console.log("page loaded");

        const links = await session.page.evaluate(() => {
            const trends = document.getElementsByClassName("discover-list")[0].children
            const links = []

            for (const trend of trends) {
                if (!trend.href.includes("/discover/")) {
                    links.push(trend.href)
                }
            }

            return links
        })

        resolve(links)
    })
}