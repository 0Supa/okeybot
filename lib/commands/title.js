module.exports = {
    name: 'title',
    description: 'sends the stream title',
    cooldown: 5,
    async execute(client, msg, utils) {
        try {
            const channel = await utils.getChannel(msg.channelID)
            if (!channel.status) return { text: 'no title is set', reply: true }
            return { text: channel.status, reply: true }
        } catch (e) {
            return { text: `Twitch API error (${e.statusCode}): ${e.message}`, reply: true }
        }
    },
};