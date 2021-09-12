const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require("fs")

const captcha = require("./captcha")
const trends = require('./trends')

puppeteer.use(StealthPlugin())
const session = {}
var browser

module.exports = {
    init: async headless => {
        return new Promise(async resolve => {
            browser = await puppeteer.launch({
                headless: headless,
                defaultViewport: null,
                args: [
                    '--no-sandbox',
                    "--remote-debugging-port=0",
                    `--window-size=800,800`,
                    //"--auto-open-devtools-for-tabs"
                ]
            })
            .catch(err => {
                console.log(err);
            })

            try {
                browser.removeAllListeners()
            }
            catch {
                console.log("[S] No event listeners registered");
            }
            

            browser.on("targetcreated", async () => {
                const page = await activeTab()
                captcha.dedect(page)
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
                const currentTrends = await trends.songs()
                const seed = Math.round(Math.random() * (currentTrends.length - 1))
                const chosenTrend = currentTrends[seed]

                links = await getVideos(chosenTrend.link, 8)
            }

            if (mode == "startpage") {
                links = await getStartpage()
            }

            console.log(`${links.length} video candidates`);
            
            if (links.length > 0) {
                const videos = []
                const randomizer = 5

                for (const link of links) {
                    const video = await analyzeVideo(link)

                    console.log("title: ", video.title);
                    console.log("likes: ", video.likes);

                    videos.push(video)
                }

                const chosenVideo = chooseVideo(videos, randomizer)
                const source = await getVideoSource(chosenVideo.link)
                const video = await downloadVideo(source)

                resolve({
                    metadata: chosenVideo,
                    buffer: video
                })
            }
            else {
                resolve(false)
            }
        })
    },
    close: async () => {
        return new Promise(async resolve => {
            console.log("closing scraper");
            await browser.close()
                .catch(err => {
                    console.log(`error on closing chrome: ${err}`);
                })

            console.log("Scraper Closed");
            
            setTimeout(() => {
                resolve(true)
            }, 1000);
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
            resolve(stats)
        })
    },
    debug: async () => {
        const meta = await analyzeVideo("https://www.tiktok.com/@imgriffinjohnson/video/6827892555624025350")
        console.log(meta);
    },
    downloadVideo: url => {
        return new Promise(async resolve => {
            var source = url

            if (!url.includes("web.tiktok.com")) {
                source = await getVideoSource(url)
            }

            const video = await downloadVideo(source)
            resolve(video)
        })
    },
    getTrends: () => {
        return new Promise(async resolve => {
            const trends = await getTrends()
            resolve(trends)
        })
    },
    getVideos: (url, max) => {
        return new Promise(async resolve => {
            const videos = await getVideos(url, max)
            resolve(videos)
        })
    }
}

function activeTab() {
    return new Promise(async resolve => {
        const pages = await browser.pages()

        resolve(pages[pages.length - 1])
    })
}

function getStartpage() {
    return new Promise(async resolve => {
        session.page.goto("https://www.tiktok.com/")
        await session.page.waitForNavigation({ timeout: 5000})
            .catch(err => {
                console.log("->");
            })

        await session.page.waitForSelector(".item-video-container")
            .catch(err => {
                console.log("item-video-container ->");
            })

        await sleep(2000)
        
        //waiting for pae to load, then scroll and wait again for videos to render
        await session.page.evaluate(() => {
            window.scrollTo({ top: 10000, behavior: 'smooth' })
        })

        await sleep(2000)

        //then start collecting links
        const videos = await session.page.evaluate(() => {
            const trendingVideos = document.getElementsByClassName("feed-item-content")
            const videoLinks = []
            
            for (const trendingVideo of trendingVideos) {
                if (videoLinks.length < 20) {
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
                reader.onerror = () => {
                    reject('Error occurred while reading binary string');
                    resolve(false)
                }
            })
        }, source)  

        
        const buffer = Buffer.from(response , 'binary');
        
        resolve(buffer)
    })


}

function getVideoSource(url) {
    return new Promise(async resolve => {
        console.log("getting video source of " + url);

        try {
            session.page.goto(url)
        }
        catch {
            resolve(false)
            return
        }
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

function chooseVideo(videos) {
    let top = false
    let max = 0
    const prevUploads = JSON.parse(fs.readFileSync("./data/uploaded.json"))

    videos.forEach(video => {
        if (video.likes > max && !prevUploads.includes(video.link)) {
            max = video.likes
            top = video
        }
    })

    return top
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function analyzeVideo(link) {
    console.log(`analyzing: ${link}`);

    return new Promise(async resolve => {
        try {
            session.page.goto(link)
            await session.page.waitForNavigation({ timeout: 3000})
                .catch(err => {
                    console.log("->");
                })
            
            await session.page.waitForSelector('.pc-action-bar')

            const metadata = await session.page.evaluate(() => {
                const panel = document.getElementsByClassName("pc-action-bar")[0]
                const videoTag = document.getElementsByTagName("video")[0]

                const likes = panel.children[0].children[1].innerHTML
                const comments = panel.children[1].children[1].innerHTML
                const videoTitle = document.title.split(document.title.indexOf("#"))[0]
                const videoMusic = document.getElementsByClassName("music-title-decoration")[0].innerText
                const creator = document.getElementsByClassName("author-uniqueId")[0].childNodes[0].textContent.replace(/"/g, "")
                const source = videoTag.src

                console.log(likes, comments);

                return [likes, comments, videoTitle, videoMusic, creator, source]
            })


            const stats = {
                link: link,
                source: metadata[5],
                title: parseTitle(metadata[2], metadata[3], metadata[4]),
                creator: metadata[4],
                tags: parseTags(metadata[2]),
                likes: parseNumber(metadata[0]),
                comments: parseNumber(metadata[1]),
                description: `#shorts - creator on TikTok: ${link} \n\n\n https://www.tiktok.com/ \n\n\n\n\n\n`,
                music: removeIllegalChars( metadata[3]),
                code: Number(link.split("/video/")[1])
            }

            resolve(stats)
        }
        catch {
            resolve({
                likes: 0,
            })
        }
    })
}

function parseTitle(title, musicRaw, creator) {
    const words = title.split(" ")
    const clean = []

    //optional mode for shorter title -> test performance
    const shortTitleMode = true

    words.forEach((word, index) => {
        if (!word.includes("#")) {
           clean.push(word)
        }
    })

    const stringed = removeIllegalChars(clean.join(" "))
    const music = removeIllegalChars(musicRaw)

    if (shortTitleMode) {
        return stringed
    }

    if (stringed.length > 4) {
        return `${music}`
    }
    else {
        return `${creator} | ${music}`
    }
}

function removeIllegalChars(string) {
    const cleanString = string
        .replace(/[<>\[\]]/g, " ")
        
    return cleanString
}

//console.log(parseTitle("@nickisartdrawings >> []]][look at this @dixiedamelio #ja #dawda #w", "ROCKSTAR - DaBaby, Roddy Ricch"));

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

function getVideos(link, maxVideos) {
    return new Promise(async resolve => {
        console.log("getting video links: " + link);

        session.page.goto(link)
            .catch(err => {
                console.log(err);
            })   
            .catch(err => {
                console.log("video-feed-item ->");
            })
        
        await captcha.isBusy()
        
        await session.page.evaluate(() => {
            window.scrollTo({ top: 20000, behavior: 'smooth' })
        })

        await sleep(2000)

        const videos = await session.page.evaluate((maxVideos) => {
            const trendingVideos = document.getElementsByClassName("video-feed-item")
            const videoLinks = []

            console.log(trendingVideos);
            
            for (const trendingVideo of trendingVideos) {
                if (videoLinks.length < maxVideos) {
                    console.log(trendingVideo);
                    try {
                        const link = trendingVideo.childNodes[0].childNodes[0].childNodes[0].childNodes[0].href
                        
                        if (link != null) {
                            videoLinks.push(link)
                        }
                    }
                    catch {
                        console.log("Failed to aquire video link, skipping...");
                    }
                }
                else {
                    break
                }
            }

            return videoLinks
        }, maxVideos)

        resolve(videos)
    })
}

function getTrends() {
    return new Promise(async resolve => {
        console.log("getting trends");

        console.log("loading page");
        session.page.goto("https://www.tiktok.com/")
        await session.page.waitForNavigation({ timeout: 10000})
            .catch(err => {
                console.log("->");
            })

        await session.page.waitForSelector(".discover-list")
            .catch(err => {
                console.log(".discover-list ->");
            })


        const links = await session.page.evaluate(() => {
            const trends = document.getElementsByClassName("discover-list")[0].children
            const links = []

            for (const trend of trends) {
                if (!trend.href.includes("/discover/")) {
                    if (trend != null) {
                        links.push(trend.href)
                    }
                }
            }

            return links
        })

        resolve(links)
    })
}