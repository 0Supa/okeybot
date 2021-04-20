module.exports = {
    name: 'title',
    description: 'sends the stream title',
    cooldown: 5,
    async execute(client, msg, utils) {
        try {
            const channel = await utils.getChannel(msg.channelID)
            if (!channel.status) return msg.reply('no title is set')
            msg.reply(channel.status)
        } catch (e) {
            msg.reply(`Twitch API error (${e.statusCode}): ${e.message}`)
        }
    },
};