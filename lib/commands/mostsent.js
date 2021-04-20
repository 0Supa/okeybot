module.exports = {
    name: 'mostsent',
    description: 'sends the target user\'s most sent message in the current channel',
    aliases: ['msm'],
    cooldown: 5,
    async execute(client, msg, utils) {
        let user = msg.user.login
        if (msg.args.length) {
            user = msg.args[0].toLowerCase().replace('@', '')
            if (user === process.env.botusername) return msg.reply('monkaS')
        }
        const query = await utils.query(`SELECT message, COUNT(message) AS message_count FROM messages WHERE user_login=? AND channel_id=? GROUP BY message ORDER BY message_count DESC LIMIT 1`, [user, msg.channelID])
        if (!query.length) return msg.reply("that user has not said anything in this channel")
        msg.reply(`${user === msg.user.login ? 'your' : "that user's"} most sent message (${query[0].message_count} times) is: ${query[0].message}`)
    },
};