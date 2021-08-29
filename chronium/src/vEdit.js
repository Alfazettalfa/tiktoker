const ffmpeg = require("fluent-ffmpeg")
const fs = require("fs");
const { resolve } = require("path");

module.exports = {
    merge: (input, workDir, output) => {
        return new Promise(async resolve => {
            const status = await merge(input, workDir, output)
            resolve(status)
        })
    },
    resize: (input, output, w, h) => {
        return new Promise(async resolve => {
            const status = await resize(input, output, w, h)
            resolve(status)
        })
    },
    probe: dir => {
        probe(dir)
    }
}

function merge(input, workDir, outFile) {
    return new Promise(resolve => {
        var output = ffmpeg();
        const clips = fs.readdirSync(input)

        for (const clip of clips) {
            output = output.addInput(`${input}/${clip}`)
            console.log(`[+] ${clip}`);
        }

        output.mergeToFile(outFile, workDir)
            .on('start', (cmdline) => console.log(cmdline))
            .on("error", e => {
                console.log(e);
                resolve(false)
            })
            .on('progress', progress => {
                frames = progress.frames;
                timemark = progress.timemark;
                console.log('currentFps:' + progress.currentFps + ' Processing: ' + progress.frames + ' timemark: ' + progress.timemark);
            })
            .on("end", () => {
                console.log("video rendered: " + outFile);
                resolve(true)
            })
    })
}

function probe(dir) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        ffmpeg.ffprobe(`${dir}/${file}`, function(err, metadata) {
            if (err) {
                console.error(err);
            } else {
                console.log(`${metadata.streams[0].width}x${metadata.streams[0].height} [${metadata.streams[0].display_aspect_ratio}]`);
            }
        });
    }
}

function resize(input, output, w, h) {
    console.log(`Resizing ${input} to ${w}x${h} => ${output}`);

    return new Promise(resolve => {
        ffmpeg(input)
            .withSize(`${w}x${h}`)
            .saveToFile(output)
            .videoCodec('libx264')
            .on('error', e => {
                console.log(e);
                resolve(false)
            })
            .on('end', () => {
                ffmpeg.ffprobe(output, function(err, metadata) {
                    if (err) {
                        console.error(err);
                        resolve(false)
                    } else {
                        if (metadata.streams[0].display_aspect_ratio != "9:16") {
                            console.log("failed render dedected, deleting...");
                            fs.unlinkSync(output)
                        }
                        resolve(true)
                    }
                });
            })
    })
}