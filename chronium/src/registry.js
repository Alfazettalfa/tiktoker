const fs = require("fs")
const file = "./data/registry.json"

module.exports = {
    register: (video) => {
        register(video)
    },
    get: query => {
        return get(query)
    },
    orderBy: (node) => {
        return orderBy(node)
    }
}

function orderBy(node) {
    const sets = get()
    const output = {}

    sets.forEach(set => {
        const value = set[node]

        if (!Object.keys(output).includes(value)) {
            output[value] = []
        }

        output[value].push(set)
    })

    Object.keys(output).forEach(cat => {
        if (output[cat].length > 1) {
            console.log(cat, output[cat].length);
        }
    })

    return output
}

function register(video) {
    return new Promise(resolve => {
        const current = get()
        const currentStringed = JSON.stringify(current)

        if (currentStringed.includes(video.link)) {
            const index = current.indexOf(video);
            current.splice(index, 1);
        }

        current.push(video)
        set(current)
    })
}

function get(query) {
    if (!query) {
        return JSON.parse(fs.readFileSync(file))
    }

    const sets = JSON.parse(fs.readFileSync(file))
    const result = []

    const key = query.split(":")[0]
    const value = query.split(":")[1]

    for (const set of sets) {
        if (set[key] == value) {
            result.push(set)
        }
    }

    return result
}

function set(data) {
    fs.writeFileSync(file, JSON.stringify(data))
}