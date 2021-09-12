const cp = require("child_process")
const fs = require("fs-extra");
var kill  = require('tree-kill');

var scraper
const crashed = []
var lastOutput = Date.now()

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}

function checkOutputActivity() {
    const maxDiff = 60 * 15

    setInterval(() => {
        const tDiff = (Date.now() - lastOutput) / 1000

        if (tDiff > maxDiff) {
            console.log(`No output since ${tDiff}, restarting...`);
            init()
        }
    }, 1000);
}

async function init() {
    //await run("sudo rm -r /tmp/*")
    var lastLog = ""

    if (scraper != undefined) {
        console.log("[handler] Killing scraper...");
        restarting = true
        crashed.push(scraper.pid)

        await kill(scraper.pid);
        await sleep(5000)
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
        
        lastOutput = Date.now()
        lastLog = data
        console.log(`[${crashed.length} | ${scraper.pid}] > ${data}`);
    });

    scraper.stderr.on("data", async buffer => {
        var data = String(buffer)
        if (data.match(/\n/g).length == 1) {
            data = data.replace(/\n/g, "")
        }

        if (!crashed.includes(scraper.pid) && !data.includes("Possible EventEmitter memory leak detected.")) {
            console.log(`[${crashed.length} | ${scraper.pid}] > ${data}`);
            
            fs.appendFileSync("./data/errors.txt", lastLog)
            fs.appendFileSync("./data/errors.txt", data)
            fs.appendFileSync("./data/errors.txt", "\n\n---------------------------------------------------------------------------------------\n\n")
            
            init()
        }
    })

    scraper.stdout.on("error", buffer => {
        var data = String(buffer)

        if (data.match(/\n/g).length == 1) {
            data = data.replace(/\n/g, "")
        }

        if (!crashed.includes(scraper.pid) && !data.includes("Possible EventEmitter memory leak detected.")) {
            console.log(`[${crashed.length} | ${scraper.pid}] > ${data}`);

            fs.appendFileSync("./data/errors.txt", "\n\n--------------------------stdout err-----------------------------------------------\n\n")
            fs.appendFileSync("./data/errors.txt", data)
            fs.appendFileSync("./data/errors.txt", "\n\n--------------------------stdout err end-----------------------------------------------\n\n")
        }
    })
}

function spawner(command) {
    const process = cp.spawn(command, [], { shell: true })

    console.log(`Started process [${process.pid}]`);

    return process
}

function run(command) {
    return new Promise(resolve => {
        cp.exec(command, (err, stdout, stderr) => {
            if (err) {
                console.log(stdout, stderr);
            }

            console.log(stdout)

            resolve()
        });
    })
}

init()
//checkOutputActivity()