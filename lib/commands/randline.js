module.exports = {
    name: 'randline',
    description: 'sends a random line from the current channel',
    aliases: ['rm', 'rl'],
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${process.env.owner_login} for more info`, reply: true }
        if (!msg.args.length) {
            const query = await utils.query(`SELECT message, timestamp, user_login FROM messages WHERE id >= ROUND (RAND() * (SELECT MAX(id) FROM messages)) AND channel_id=? LIMIT 1`, [msg.channel.id])
            if (!query.length) return { text: "there's no logged messages in this channel", reply: true }
            return { text: `(${utils.humanize(query[0].timestamp)} ago) ${query[0].user_login}: ${query[0].message}`, reply: true }
        }
        const user = msg.args[0].replace('@', '')
        if (user === process.env.botusername) return { text: 'monkaS', reply: true }
        const query = await utils.query(`SELECT message, timestamp, user_login FROM messages WHERE id >= ROUND (RAND() * (SELECT MAX(id) FROM messages)) AND channel_id=? AND user_login=? LIMIT 1`, [msg.channel.id, user])
        if (!query.length) return { text: "that user has not said anything in this channel", reply: true }
        return { text: `(${utils.humanize(query[0].timestamp)} ago): ${query[0].message}`, reply: true }
    },
};