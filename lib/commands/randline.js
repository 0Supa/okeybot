module.exports = {
    name: 'randline',
    description: 'sends a random line from the current channel',
    aliases: ['rm', 'rl'],
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${process.env.owner_login} for more info`, reply: true }
        if (!msg.args.length) {
            const query = utils.randArray(await utils.query(`SELECT user_login, message, timestamp FROM messages WHERE channel_id=? LIMIT 10000`, [msg.channel.id]))
            if (!query.length) return { text: "there's no logged messages in this channel", reply: true }
            return { text: `(${utils.humanize(query[0].timestamp)} ago) ${query[0].user_login}: ${query[0].message}`, reply: true }
        }
        const user = msg.args[0].replace('@', '')
        if (user === process.env.botusername) return { text: 'monkaS', reply: true }
        const query = utils.randArray(await utils.query(`SELECT user_login, message, timestamp FROM messages WHERE channel_id=? AND user_login=? LIMIT 10000`, [msg.channel.id, user]))
        if (!query.length) return { text: "that user has not said anything in this channel", reply: true }
        return { text: `(${utils.humanize(query[0].timestamp)} ago): ${query[0].message}`, reply: true }
    },
};