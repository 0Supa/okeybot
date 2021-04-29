const twitchapi = require('../utils/twitchapi.js')
const { parseSec } = require('../utils/utils.js')

module.exports = {
    name: 'uptime',
    description: 'sends the stream uptime',
    cooldown: 5,
    async execute(client, msg, utils) {
        const stream = await twitchapi.getStream(msg.channelID)
        if (!stream) return { text: 'the streamer is offline', reply: true }
        const date = Math.abs(new Date() - new Date(stream.created_at)) / 1000
        return { text: parseSec(date), reply: true }
    },
};