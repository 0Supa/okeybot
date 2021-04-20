module.exports = {
    name: 'randmsg',
    description: 'sends a random message from the current channel',
    aliases: ['rm'],
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.args.length) {
            const query = await utils.query(`SELECT message, timestamp, user_login FROM messages WHERE channel_id=? ORDER BY RAND() LIMIT 1`, [msg.channelID])
            if (!query.length) return msg.reply("there's no logged messages in this channel")
            const date = Math.abs(new Date() - query[0].timestamp) / 1000
            msg.reply(`(${utils.parseSec(date)} ago) ${query[0].user_login}: ${query[0].message}`)
        } else {
            const user = msg.args[0].toLowerCase().replace('@', '')
            if (user === process.env.botusername) return msg.reply('monkaS')
            const query = await utils.query(`SELECT message, timestamp FROM messages WHERE channel_id=? AND user_login=? ORDER BY RAND() LIMIT 1`, [msg.channelID, user])
            if (!query.length) return msg.reply("that user has not said anything in this channel")
            const date = Math.abs(new Date() - query[0].timestamp) / 1000
            msg.reply(`(${utils.parseSec(date)} ago): ${query[0].message}`)
        }
    },
};