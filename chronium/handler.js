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

        await kill(scraper.pid);
        await sleep(3000)
    }

    try {
        scraper.removeAllListeners();
    }
    catch {
        console.log("[H] No event listeners registered");
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

        if (!crashed.includes(scraper.pid) && !data.includes("Possible EventEmitter memory leak detected.")) {
            fs.appendFileSync("./data/errors.txt", data)
            fs.appendFileSync("./data/errors.txt", "\n\n---------------------------------------------------------------------------------------\n\n")
            
            crashed.push(scraper.pid)
            init()
        }
    })

    scraper.stdout.on("error", buffer => {
        var data = String(buffer)

        if (data.match(/\n/g).length == 1) {
            data = data.replace(/\n/g, "")
        }
        fs.appendFileSync("./data/errors.txt", "\n\n--------------------------stdout err-----------------------------------------------\n\n")
        s.appendFileSync("./data/errors.txt", data)
        fs.appendFileSync("./data/errors.txt", "\n\n--------------------------stdout err end-----------------------------------------------\n\n")

    })
}

function spawner(command) {
    const process = cp.spawn(command, [], { shell: true })

    console.log(`Started process [${process.pid}]`);

    return process
}

init()