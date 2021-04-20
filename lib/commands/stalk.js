module.exports = {
    name: 'stalk',
    description: 'sends the target user\'s last seen chat message',
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.args.length) return msg.reply('you need to specify a username')
        const user = msg.args[0].toLowerCase().replace('@', '')
        if (user === msg.user.login) return msg.reply('4Head')
        if (user === process.env.botusername) return msg.reply("I'm here FeelsDankMan")
        const query = await utils.query(`SELECT message, timestamp, channel_login FROM messages WHERE user_login=? ORDER BY timestamp DESC LIMIT 1`, [user])
        if (!query.length) return msg.reply("I've never seen that user in chat")
        const date = Math.abs(new Date() - query[0].timestamp) / 1000
        msg.reply(`that user's last seen message was sent ${utils.parseSec(date)} ago in ${query[0].channel_login === user ? 'his' : `${query[0].channel_login}'s`} chat: ${query[0].message}`)
    },
};