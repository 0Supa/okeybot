module.exports = {
    name: 'randline',
    description: 'sends a random line from the current channel',
    aliases: ['rm', 'rl'],
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${process.env.owner_login} for more info`, reply: true }
        if (!msg.args.length) {
            const query = await utils.query(`SELECT user_login, message AS text, timestamp FROM messages WHERE channel_id=? LIMIT 10000`, [msg.channel.id])
            if (!query.length) return { text: "there's no logged messages in this channel", reply: true }
            const message = utils.randArray(query)
            return { text: `(${utils.humanize(message.timestamp)} ago) ${message.user_login}: ${message.text}`, reply: true }
        }
        const user = msg.args[0].replace('@', '')
        if (user === process.env.botusername) return { text: 'monkaS', reply: true }
        const query = await utils.query(`SELECT user_login, message AS text, timestamp FROM messages WHERE channel_id=? AND user_login=? LIMIT 10000`, [msg.channel.id, user])
        if (!query.length) return { text: "that user has not said anything in this channel", reply: true }
        const message = utils.randArray(query)
        return { text: `(${utils.humanize(message.timestamp)} ago): ${message.text}`, reply: true }
    },
};