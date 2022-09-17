const { gql } = require("../utils/twitchapi.js")
const { predictionTracker } = require('../misc/pubsubEvents.js')

module.exports = {
    name: 'prediction',
    description: 'Create Twitch predictions from chat',
    access: 'mod',
    botRequires: 'mod',
    usage: "<prediction time in seconds> <outcome 1 (blue), like 'yes'> <outcome 2 (pink), like 'no'> <name>",
    cooldown: 3,
    async execute(client, msg, utils) {
        const usage = `usage: ${this.usage}`
        if (msg.args.length < 4) return { text: usage, reply: true }

        const time = parseInt(msg.args[0])
        if (isNaN(time)) return { text: `invalid time, ${usage}`, reply: true }
        if (time > 1800) return { text: "you can't make predictions longer than 30 minutes", reply: true }
        if (time < 1) return { text: "you can't make predictions shorter than 1 second", reply: true }

        const { data } = await gql({
            json: {
                "operationName": "createPredictionEvent",
                "variables": {
                    "input": {
                        "title": msg.args.slice(3).join(' '),
                        "channelID": msg.channel.id,
                        "outcomes": [
                            {
                                "title": msg.args[1],
                                "color": "BLUE"
                            },
                            {
                                "title": msg.args[2],
                                "color": "PINK"
                            }
                        ],
                        "predictionWindowSeconds": time
                    }
                }
            }
        }).json()
        const e = data.createPredictionEvent
        if (!e) return { text: `failed creating prediction (internal error)`, reply: true }

        const err = e.error
        if (err) {
            if (err.code === 'AUTOMOD_FAILED') return { text: 'your prediction name is not compliant with Twitch guidelines', reply: true }
            else return { text: `failed creating prediction: ${err.code}`, reply: true }
        }

        predictionTracker.add(e.predictionEvent.id)
    },
};
