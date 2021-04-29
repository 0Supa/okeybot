module.exports = {
    name: 'randmsg',
    description: 'sends a random message from the current channel',
    aliases: ['rm'],
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.args.length) {
            const query = await utils.query(`SELECT message, timestamp, user_login FROM messages WHERE channel_id=? ORDER BY RAND() LIMIT 1`, [msg.channel.id])
            if (!query.length) return { text: "there's no logged messages in this channel", reply: true }
            const date = Math.abs(new Date() - query[0].timestamp) / 1000
            return { text: `(${utils.parseSec(date)} ago) ${query[0].user_login}: ${query[0].message}`, reply: true }
        }
        const user = msg.args[0].toLowerCase().replace('@', '')
        if (user === process.env.botusername) return { text: 'monkaS', reply: true }
        const query = await utils.query(`SELECT message, timestamp FROM messages WHERE channel_id=? AND user_login=? ORDER BY RAND() LIMIT 1`, [msg.channel.id, user])
        if (!query.length) return { text: "that user has not said anything in this channel", reply: true }
        const date = Math.abs(new Date() - query[0].timestamp) / 1000
        return { text: `(${utils.parseSec(date)} ago): ${query[0].message}`, reply: true }
    },
};