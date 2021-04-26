module.exports = {
    name: 'uptime',
    description: 'sends the stream uptime',
    cooldown: 5,
    async execute(client, msg, utils) {
        const stream = await utils.getStream(msg.channelID)
        if (!stream) return { text: 'the streamer is offline', reply: true }
        const date = Math.abs(new Date() - new Date(stream.created_at)) / 1000
        return { text: utils.parseSec(date), reply: true }
    },
};