const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'title',
    description: 'sends the stream title',
    cooldown: 5,
    async execute(client, msg, utils) {
        const channel = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login
        const stream = await twitchapi.getStream(channel)

        if (!stream) return { text: 'user was not found', reply: true }
        if (!stream.title) return { text: `${channel === msg.channel.login ? "this" : "that"} channel has no stream title set`, reply: true }
        return { text: `${channel}'s stream title: ${stream.title}`, reply: true }
    },
};