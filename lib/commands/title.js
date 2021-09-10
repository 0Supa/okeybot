const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'title',
    description: 'sends the stream title',
    cooldown: 5,
    async execute(client, msg, utils) {
        try {
            const channel = await twitchapi.getChannel(msg.channel.id)
            if (!channel.title) return { text: 'no title is set', reply: true }
            return { text: `Stream Title: ${channel.title.replace(/(\r\n|\n|\r)/gm, ' ')}`, reply: true }
        } catch (e) {
            return { text: `Twitch API error (${e.statusCode}): ${e.message}`, reply: true }
        }
    },
};