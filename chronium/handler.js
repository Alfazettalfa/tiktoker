const cp = require("child_process")
const fs = require("fs")
var kill  = require('tree-kill');

var scraper
const crashed = []

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}

async function init() {
    if (scraper != undefined) {
        console.log("[handler] Killing scraper...");
        restarting = true

        kill(scraper.pid);
        await sleep(3000)
    }

    scraper = spawner("node ./index.js")

    scraper.stdout.on('data', async buffer => {
        var data = String(buffer)

        if (data.match(/\n/g).length == 1) {
            data = data.replace(/\n/g, "")
        }
        
        //console.log(data.replace(/\n/g, '/n'));

        console.log(`[${crashed.length} | ${scraper.pid}] > ${data}`);
    });

    scraper.stderr.on("data", async buffer => {
        var data = String(buffer)
        if (data.match(/\n/g).length == 1) {
            data = data.replace(/\n/g, "")
        }

        console.log(`[${crashed.length} | ${scraper.pid}] > ${data}`);

        if (!crashed.includes(scraper.pid)) {
            fs.appendFileSync("./data/errors.txt", data)
            crashed.push(scraper.pid)
            init()
        }
    })
}

function spawner(command) {
    const process = cp.spawn(command, [], { shell: true })

    return process
}

init()