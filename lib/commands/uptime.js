module.exports = {
    name: 'uptime',
    description: 'sends the stream uptime',
    cooldown: 5,
    async execute(client, msg, utils) {
        const stream = await utils.getStream(msg.channelID)
        if (!stream) return msg.reply('the streamer is offline')
        const date = Math.abs(new Date() - new Date(stream.created_at)) / 1000
        msg.reply(utils.parseSec(date))
    },
};