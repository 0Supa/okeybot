module.exports = {
    name: 'firstmsg',
    description: 'sends the target user\'s first message in the current channel',
    aliases: ['fm'],
    cooldown: 5,
    async execute(client, msg, utils) {
        let user = msg.user.login
        if (msg.args.length) {
            user = msg.args[0].toLowerCase().replace('@', '')
            if (user === process.env.botusername) return msg.reply('monkaS')
        }
        const query = await utils.query(`SELECT message, timestamp FROM messages WHERE user_login=? AND channel_id=? ORDER BY timestamp LIMIT 1`, [user, msg.channelID])
        if (!query.length) return msg.reply('that user has not said anything in this channel')
        const date = Math.abs(new Date() - query[0].timestamp) / 1000
        msg.reply(`${user === msg.user.login ? 'your' : "that user's"} first message was sent ${utils.parseSec(date)} ago: ${query[0].message}`)
    },
};