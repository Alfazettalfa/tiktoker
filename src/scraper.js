const puppeteer = require('puppeteer-extra')
const stealthPlugin = require("puppeteer-extra-plugin-stealth")();
const session = {}


  
puppeteer.use(stealthPlugin);

module.exports = {
    init: async () => {
        return new Promise(async resolve => {
            session.browser = await puppeteer.launch({
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

            session.page = await session.browser.newPage()

            resolve()
        })
    },
    getTikTok: async config => {
        return new Promise(async resolve => {
            console.log("starting scrape...");

            const trends = [
                'https://www.tiktok.com/tag/blackout?lang=en',
                'https://www.tiktok.com/tag/catchchallenge?lang=en',
                'https://www.tiktok.com/tag/familyfirst?lang=en',
                'https://www.tiktok.com/music/Savage-6800996740322297858?lang=en',
                'https://www.tiktok.com/music/Party-Girl-6802011143096339205?lang=en',
                'https://www.tiktok.com/music/ROCKSTAR-6818447895918807041?lang=en',
                'https://www.tiktok.com/tag/endlichzukunft?lang=en',
                'https://www.tiktok.com/tag/gamingsommer?lang=en'
            ]

            const chosenTrend = trends[Math.round(Math.random() * trends.length - 1)]
            
            const links = await getVideos(chosenTrend)
            const videos = []

            console.log(links);

            for (const link of links) {
                const video = await analyzeVideo(link)
                console.log(video);
                videos.push(video)
            }

            const mostLikedVideo = mostLiked(videos)
            const source = getVideoSource(mostLikedVideo.link)
        })
    },
    close: async () => {
        return new Promise(async resolve => {
            if (session.browser =! undefined) {
                await session.browser.close()
            }

            console.log("Scraper Closed");
            resolve(true)
        })
    },
    getVideoSource: url => {
        return new Promise(async resolve => {
            const source = await getVideoSource(url)
            console.log(source);

            resolve(source)
        })
    },
    analyzeVideo: src => {
        return new Promise (async resolve => {
            const stats = await analyzeVideo(src)
            console.log(stats);
        })
    }
}

function getVideoSource(url) {
    return new Promise(async resolve => {
        console.log("getting video source of " + url);

        session.page.goto(url)
        await session.page.waitForNavigation({ timeout: 3000})
            .catch(err => {
                console.log("->");
            })

        await session.page.evaluate(() => {
            const video = document.getElementsByTagName("video")[0]
            console.log(video);

            video.addEventListener('play', (event) => {
                console.log('The Boolean paused property is now false. Either the ' +
                'play() method was called or the autoplay attribute was toggled.');
            });
        })
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


        const metadata = await session.page.evaluate(() => {
            const panel = document.getElementsByClassName("pc-action-bar")[0]

            const likes = panel.children[0].children[1].innerHTML
            const comments = panel.children[1].children[1].innerHTML
            const videoTitle = document.title

            console.log(likes, comments);

            return [likes, comments, videoTitle]
        })



        const stats = {
            link: link,
            title: metadata[2],
            tags: parseTags(metadata[2]),
            likes: parseNumber(metadata[0]),
            comments: parseNumber(metadata[1])
        }

        resolve(stats)
    })
}

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

        const videos = await session.page.evaluate(() => {
            const trendingVideos = document.getElementsByClassName("video-feed-item")
            const videoLinks = []

            console.log(trendingVideos);
            
            for (const trendingVideo of trendingVideos) {
                if (videoLinks.length < 11) {
                    const link = trendingVideo.childNodes[1].childNodes[0].href
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
        await session.page.waitForNavigation({ timeout: 3000})
            .catch(err => {
                console.log("->");
            })

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