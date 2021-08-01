const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'uptime',
    description: 'sends the stream uptime',
    cooldown: 5,
    async execute(client, msg, utils) {
        const stream = await twitchapi.getStream(msg.channel.id)
        if (!stream) return { text: 'the streamer is offline', reply: true }
        return { text: utils.humanize(stream.started_at), reply: true }
    },
};