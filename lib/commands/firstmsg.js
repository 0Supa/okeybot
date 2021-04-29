module.exports = {
    name: 'firstmsg',
    description: 'sends the target user\'s first seen message in the current channel',
    aliases: ['fm'],
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        let user = msg.user.login
        if (msg.args.length) {
            user = msg.args[0].toLowerCase().replace('@', '')
            if (user === process.env.botusername) return { text: 'monkaS', reply: true }
        }
        const query = await utils.query(`SELECT message, timestamp FROM messages WHERE user_login=? AND channel_id=? ORDER BY timestamp LIMIT 1`, [user, msg.channel.id])
        if (!query.length) return { text: 'that user has not said anything in this channel', reply: true }
        const date = Math.abs(new Date() - query[0].timestamp) / 1000
        return { text: `${user === msg.user.login ? 'your' : "that user's"} first seen message was sent ${utils.parseSec(date)} ago: ${query[0].message}`, reply: true }
    },
};